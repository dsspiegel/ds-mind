import pickle
import base64
import sys
from io import StringIO
from typing import Dict, Any, Optional
from google.cloud import firestore
import pandas as pd
import numpy as np
import traceback

from models import Claim, ExecutePythonResponse, ExecutePythonRequest

SESSION_CACHE: Dict[str, Dict[str, Any]] = {}
INJECTED_OBJECTS = {'pd': pd, 'np': np, 'DataFrame': pd.DataFrame}
db = firestore.Client()

def _can_pickle(obj: Any) -> bool:
    """Check if object is picklable."""
    try:
        pickle.dumps(obj)
        return True
    except:
        return False

def load_session_state(session_id: str) -> Dict[str, Any]:
    """Load from cache → Firestore → create fresh"""
    if session_id in SESSION_CACHE:
        ns = SESSION_CACHE[session_id].copy()
        ns.update(INJECTED_OBJECTS)
        return ns
    
    doc = db.collection('sessions').document(session_id).get()
    if doc.exists and doc.to_dict().get('state_pickle'):
        try:
            ns = pickle.loads(base64.b64decode(doc.to_dict()['state_pickle']))
            ns.update(INJECTED_OBJECTS)
            SESSION_CACHE[session_id] = ns.copy()
            return ns
        except: pass
    
    return {'__builtins__': __builtins__, **INJECTED_OBJECTS}

def save_session_state(session_id: str, namespace: Dict, cells: list, mind_id: str):
    """Filter unpicklable, save to Firestore"""
    picklable = {k: v for k, v in namespace.items() 
                 if not k.startswith('_') and k not in INJECTED_OBJECTS
                 and _can_pickle(v)}
    SESSION_CACHE[session_id] = picklable.copy()
    
    db.collection('sessions').document(session_id).set({
        'mind_id': mind_id,
        'state_pickle': base64.b64encode(pickle.dumps(picklable)).decode(),
        'cells': cells,
        'updated_at': firestore.SERVER_TIMESTAMP
    }, merge=True)

def format_output(value):
    if isinstance(value, pd.DataFrame):
        return {
            'output': f"DataFrame: {value.shape[0]} rows × {value.shape[1]} cols",
            'output_type': 'dataframe',
            'display_data': {
                'html': value.head(50).to_html(),
                'shape': list(value.shape),
                'columns': list(value.columns)
            }
        }
    return {'output': repr(value), 'output_type': 'text'}

def extract_claim(code, result, cell_id) -> Optional[Claim]:
    """Extract meaningful insight from code execution using Gemini."""
    if result.get('error'): 
        return None
    
    # Only extract claims from meaningful output
    output_text = result.get('output', '')
    display_data = result.get('display_data', {})
    
    if not output_text and not display_data:
        return None
    
    # Build context for Gemini
    context_parts = []
    if output_text:
        context_parts.append(f"OUTPUT:\n{output_text[:500]}")
    if display_data.get('html'):
        context_parts.append(f"TABLE DATA (shape {display_data.get('shape', [])}, columns: {display_data.get('columns', [])})")
    
    if not context_parts:
        return None
    
    try:
        from google import genai
        from config import GOOGLE_API_KEY
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"""Extract the KEY INSIGHT from this Python analysis in ONE sentence.
Include specific numbers, percentages, device names, or other concrete metrics.
If there's no clear insight, respond with just "NO_INSIGHT".

CODE:
{code[:500]}

{chr(10).join(context_parts)}

Example good response: "Nest Audio has 15.2% churn rate, significantly higher than Nest Hub at 8.1%"
Example bad response: "Analyzed a DataFrame" (too generic)
"""
        response = client.models.generate_content(model='gemini-3-flash-preview', contents=prompt)
        content = response.text.strip()
        
        if content == "NO_INSIGHT" or len(content) < 10:
            return None
            
        return Claim(
            content=content,
            type="observation",
            confidence=0.85,
            source=f"notebook_{cell_id}",
            metadata={'code': code[:200]}
        )
    except Exception as e:
        # Fallback to simple extraction if Gemini fails
        if result.get('output_type') == 'dataframe':
            shape = display_data.get('shape', [0, 0])
            return Claim(
                content=f"Analyzed DataFrame with {shape[0]} rows",
                type="observation",
                confidence=0.5,
                source=f"notebook_{cell_id}",
                metadata={'code': code[:200]}
            )
        return None

def execute_cell(session_id, cell_id, code, cell_order, mind_id, auto_learn=True):
    namespace = load_session_state(session_id)
    
    old_stdout, sys.stdout = sys.stdout, StringIO()
    result = {"cell_id": cell_id, "output": "", "output_type": "text", "error": None, "generated_claims": []}
    
    try:
        try:
            value = eval(code, namespace)
            if value is not None:
                result.update(format_output(value))
        except SyntaxError:
            exec(code, namespace)
        
        stdout = sys.stdout.getvalue()
        if stdout and not result.get('display_data'):
            result['output'] = stdout
    except Exception as e:
        result['error'] = traceback.format_exc()
        result['output_type'] = 'error'
    finally:
        sys.stdout = old_stdout
    
    # Extract claim if meaningful
    claim = extract_claim(code, result, cell_id)
    if claim:
        if auto_learn:
            db.collection('minds').document(mind_id).set({
                'claims': firestore.ArrayUnion([claim.dict()])
            }, merge=True)
            result['claim_generated'] = claim
        else:
            # Ephemeral claim
            result['generated_claims'] = [claim]
            # We don't set claim_generated property to avoid frontend confusion regarding "saved" status
            # Actually, frontend logic might expect claim_generated for display.
            # But frontend handles generated_claims for pending.
            # Let's set claim_generated for immediate feedback in the cell, but confusing...
            # The prompt says: "When Auto-learn is OFF: ... Claims are held in session state only"
            # So we should return it but not save it.
            result['claim_generated'] = claim # For display in cell
    
    # Update cells and save
    doc = db.collection('sessions').document(session_id).get()
    cells = doc.to_dict().get('cells', []) if doc.exists else []
    cell_data = {'id': cell_id, 'order': cell_order, 'code': code, 
                 'output': result.get('output', ''), 'output_type': result['output_type']}
    
    idx = next((i for i, c in enumerate(cells) if c['id'] == cell_id), None)
    if idx is not None: cells[idx] = cell_data
    else: cells.append(cell_data)
    
    save_session_state(session_id, namespace, cells, mind_id)
    return result
