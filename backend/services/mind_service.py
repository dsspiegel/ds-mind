from google.cloud import firestore
from google import genai
from config import GOOGLE_API_KEY, GEMINI_DISTILL_MODEL
from models import Claim, ChatResponse

db = firestore.Client()
DATA_KEYWORDS = ['how many', 'count', 'total', 'average', 'query', 'select', 'show me', 'list']

def get_mind(mind_id: str):
    doc = db.collection('minds').document(mind_id).get()
    return doc.to_dict() if doc.exists else None

def should_handoff(question: str) -> bool:
    return any(kw in question.lower() for kw in DATA_KEYWORDS)

def retrieve_claims(mind_id: str, question: str, max_n: int = 10) -> list:
    mind = get_mind(mind_id)
    if not mind: return []
    
    claims = mind.get('claims', [])
    question_words = set(question.lower().split())
    
    scored = []
    for c in claims:
        score = c.get('confidence', 0.5)
        if c.get('type') == 'correction': score += 0.5
        overlap = len(question_words & set(c.get('content', '').lower().split()))
        score += overlap * 0.1
        scored.append((score, c))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:max_n]]

def chat(request):
    if should_handoff(request.question):
        from services.sql_service import generate_sql_from_text
        sql = generate_sql_from_text(request.question, request.mind_id)
        return ChatResponse(
            answer="This looks like a data question. I've generated SQL for you:",
            claims_used=[],
            handoff={'type': 'sql', 'sql': sql}
        )
    
    claims = retrieve_claims(request.mind_id, request.question)
    
    # Build context instruction based on current tab
    context_instruction = ""
    if request.context == "colab":
        context_instruction = "The user is currently in the Python notebook. Focus on Python, pandas, and data analysis advice."
    elif request.context == "plx":
        context_instruction = "The user is currently in the SQL workbench. Focus on SQL, BigQuery syntax, and query optimization."
    elif request.context == "about":
        context_instruction = "The user is on the About page. Help them understand how this application works, its architecture, and the knowledge persistence system."
    
    if not claims:
        if request.context == "about":
            return ChatResponse(
                answer="This is an Expert Knowledge Persistence System. It learns from your Python and SQL analyses, storing insights as 'claims' that I can reference later. Try running some analyses in the Colab or Plx tabs, then ask me questions!",
                claims_used=[]
            )
        return ChatResponse(
            answer="I don't have specific knowledge about that yet. Run some analysis in the Notebook or PLX tabs, and I'll learn from it.",
            claims_used=[]
        )
    
    claims_text = "\n".join([f"- {c.get('content')} [source: {c.get('source')}]" for c in claims])
    
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        prompt = f"""Answer using ONLY this knowledge. Be specific and cite sources.

{context_instruction}

KNOWLEDGE:
{claims_text}

QUESTION: {request.question}

Reference specific analysis (e.g., "Based on the notebook analysis...") and cite numbers."""
        
        response = client.models.generate_content(
            model=request.model,
            contents=prompt
        )
        answer = response.text.strip()
    except Exception as e:
        print(f"Gemini API error in chat: {e}")
        answer = f"Based on my knowledge:\n" + "\n".join([f"• {c.get('content')}" for c in claims[:3]])
    
    return ChatResponse(answer=answer, claims_used=claims)

def teach(mind_id: str, content: str):
    claim = Claim(content=content, type="correction", confidence=1.0, source="manual_teach")
    db.collection('minds').document(mind_id).set({
        'claims': firestore.ArrayUnion([claim.dict()])
    }, merge=True)
    return claim

def distill_source(file_content: bytes = None, filename: str = "", text_content: str = "") -> dict:
    """Read source, distill with Gemini, return structured 'Source' object."""
    import pypdf
    import io
    import re
    import json
    
    # 1. Extract Text
    full_text = text_content
    if file_content:
        if filename.endswith('.pdf'):
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                full_text = "\n".join([page.extract_text() for page in reader.pages])
            except Exception as e:
                print(f"Error reading PDF: {e}")
                full_text = "Error reading PDF file."
        else:
            full_text = file_content.decode('utf-8', errors='ignore')

    if not full_text:
        return None

    # 2. Prepare Prompt
    try:
        with open("prompts/distillation_prompt.md", "r") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = "You are an expert knowledge distillation system. Summarize the text into Overview, JSON (facts), and YAML (reasoning)."

    client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # 3. Call Gemini
    response = client.models.generate_content(
        model=GEMINI_DISTILL_MODEL, # Use a strong model for distillation
        contents=[
            system_prompt,
            f"\n\nSOURCE TEXT ({filename}):\n{full_text[:30000]}" # Truncate if too huge for single pass (basic safety)
        ]
    )
    
    distilled_content = response.text
    
    # 4. Parse Sections
    # Robust regex to find the three headers
    overview_match = re.search(r'# Overview\s*(.*?)\s*(?=# Structured Summary|$)', distilled_content, re.DOTALL)
    json_match = re.search(r'# Structured Summary \(JSON\)\s*(?:```json)?\s*(.*?)\s*(?:```)?\s*(?=# Application & Reasoning|$)', distilled_content, re.DOTALL)
    yaml_match = re.search(r'# Application & Reasoning \(YAML\)\s*(?:```yaml)?\s*(.*?)\s*(?:```)?\s*$', distilled_content, re.DOTALL)
    
    overview = overview_match.group(1).strip() if overview_match else ""
    json_str = json_match.group(1).strip() if json_match else "{}"
    yaml_str = yaml_match.group(1).strip() if yaml_match else ""
    
    # 5. Extract Details
    extracted_claims = []
    try:
        data = json.loads(json_str)
        # Try to find list-like items in the JSON to turn into claims
        # We look for keys like 'claims', 'facts', 'key_concepts', etc.
        for key, val in data.items():
            if isinstance(val, list):
                for item in val:
                    content = str(item)
                    if isinstance(item, dict):
                        # Try to format nice strings from dicts
                        if 'statement' in item: content = item['statement']
                        elif 'definition' in item and 'name' in item: content = f"{item['name']}: {item['definition']}"
                    
                    extracted_claims.append({
                         'content': content,
                         'type': 'observation',
                         'confidence': 0.9,
                         'source': f"distill:{filename}"
                    })
    except json.JSONDecodeError as e:
        print(f"Failed to parse structured JSON from distillation: {e}")

    return {
        'filename': filename,
        'original_text_preview': full_text[:200],
        'distilled_content': distilled_content,
        'overview': overview,
        'structured_json': json_str,
        'reasoning_yaml': yaml_str,
        'extracted_claims': extracted_claims
    }

def create_mind_with_source(name: str, source_data: dict = None):
    from models import Mind, Claim
    
    new_mind = Mind(name=name)
    
    if source_data:
        # Add source
        new_mind.sources.append(source_data)
        
        # Add extracted claims
        for c in source_data.get('extracted_claims', []):
            claim = Claim(
                content=c['content'],
                type=c['type'],
                confidence=c['confidence'],
                source=c['source']
            )
            new_mind.claims.append(claim)
            
        # Add 'Overview' as a foundational claim
        if source_data.get('overview'):
            new_mind.claims.append(Claim(
                content=f"Overview of {source_data['filename']}: {source_data['overview'][:500]}...",
                type="observation",
                confidence=1.0,
                source=f"distill:overview"
            ))
            
    db.collection('minds').document(new_mind.id).set(new_mind.dict())
    return new_mind
