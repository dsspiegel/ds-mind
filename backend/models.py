from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
from datetime import datetime
import uuid

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix."""
    return f"{prefix}{uuid.uuid4().hex[:8]}"

class Claim(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("claim-"))
    content: str                              # The knowledge
    type: Literal["observation", "correction"] = "observation"
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    source: str                               # "notebook_cell_5", "plx_query_3"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Mind(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("mind-"))
    name: str
    owner: str = "demo_user"
    claims: List[Claim] = Field(default_factory=list)
    sources: List[Dict[str, Any]] = Field(default_factory=list) # Distilled source documents
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NotebookSession(BaseModel):
    id: str
    mind_id: str
    cells: List[dict] = Field(default_factory=list)
    state_pickle: Optional[str] = None  # Base64-encoded

class ExecutePythonRequest(BaseModel):
    session_id: str
    cell_id: str
    code: str
    cell_order: int
    mind_id: str
    auto_learn: bool = True  # Default to True to match existing behavior

class ExecutePythonResponse(BaseModel):
    cell_id: str
    output: str
    output_type: str
    error: Optional[str] = None
    display_data: Optional[Dict[str, Any]] = None
    claim_generated: Optional[Claim] = None
    generated_claims: List[Claim] = Field(default_factory=list) # For returning ephemeral claims

class ChatRequest(BaseModel):
    mind_id: str
    question: str
    model: str = "gemini-3-flash-preview"
    context: Optional[str] = None  # "colab", "plx", or "about"

class ChatResponse(BaseModel):
    answer: str
    claims_used: List[Claim] = Field(default_factory=list)
    handoff: Optional[Dict[str, Any]] = None
