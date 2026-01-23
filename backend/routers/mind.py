from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import List, Optional
from models import Mind, Claim, ChatRequest, ChatResponse
from services.mind_service import chat, teach, db
from google.cloud import firestore
from google import genai
from config import GOOGLE_API_KEY

router = APIRouter()

@router.post("/", response_model=Mind)
async def create_mind_endpoint(
    name: str = Form(...),
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    claims_json: Optional[str] = Form(None)
):
    from services.mind_service import distill_source, create_mind_with_source
    import json
    
    source_datas = []
    
    # Process text context if provided
    if text_content and text_content.strip():
        text_source = distill_source(text_content=text_content, filename="context.txt")
        if text_source:
             source_datas.append(text_source)

    # Process file if provided
    if file:
        content = await file.read()
        file_source = distill_source(file_content=content, filename=file.filename)
        if file_source:
            source_datas.append(file_source)
            
    from models import Mind, Claim
    new_mind = Mind(name=name)
    
    # Process explicit claims (e.g. from session save)
    if claims_json:
        try:
            claims_list = json.loads(claims_json)
            for c in claims_list:
                # Re-validate as Claim objects to ensure ID generation etc if needed, 
                # but better to just use dict if they are already formatted
                # if 'id' not in c: c['id'] = ... # Removed to use model default
                # Re-validate as Claim objects
                new_mind.claims.append(Claim(**c))
        except Exception as e:
            print(f"Error parsing claims_json: {e}")

    for source_data in source_datas:
        new_mind.sources.append(source_data)
        for c in source_data.get('extracted_claims', []):
            claim = Claim(
                content=c['content'],
                type=c['type'],
                confidence=c['confidence'],
                source=c['source']
            )
            new_mind.claims.append(claim)
        
        if source_data.get('overview'):
            new_mind.claims.append(Claim(
                content=f"Overview of {source_data['filename']}: {source_data['overview'][:500]}...",
                type="observation",
                confidence=1.0,
                source=f"distill:overview"
            ))

    db.collection('minds').document(new_mind.id).set(new_mind.dict())
    return new_mind

@router.post("/{mind_id}/claims")
async def add_claims_endpoint(mind_id: str, claims: List[dict]):
    """Batch add claims to an existing mind"""
    try:
        # Convert dicts to Claim objects
        claim_objs = [Claim(**c).dict() for c in claims]
        
        db.collection('minds').document(mind_id).update({
            'claims': firestore.ArrayUnion(claim_objs)
        })
        return {"success": True, "count": len(claims)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{mind_id}/fork")
async def fork_mind_endpoint(mind_id: str, new_name: str = Form(...)):
    """Fork an existing mind"""
    doc = db.collection('minds').document(mind_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Mind not found")
    
    original_data = doc.to_dict()
    from models import Mind
    
    new_mind = Mind(
        name=new_name,
        claims=original_data.get('claims', []),
        sources=original_data.get('sources', [])
    )
    
    db.collection('minds').document(new_mind.id).set(new_mind.dict())
    return new_mind

@router.get("/", response_model=List[dict])
async def list_minds():
    docs = db.collection('minds').stream()
    return [{'id': d.id, **d.to_dict()} for d in docs]

@router.get("/models")
async def list_models():
    client = genai.Client(api_key=GOOGLE_API_KEY)
    models = []
    for m in client.models.list():
        models.append({
            "name": getattr(m, "name", None) or getattr(m, "model", None),
            "supported_actions": getattr(m, "supported_actions", None),
        })
    return {"models": models}

@router.delete("/{mind_id}")
async def delete_mind_endpoint(mind_id: str):
    doc_ref = db.collection('minds').document(mind_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Mind not found")
    doc_ref.delete()
    return {"success": True, "id": mind_id}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    return chat(request)

@router.post("/teach")
async def teach_endpoint(mind_id: str, content: str):
    return teach(mind_id, content)
