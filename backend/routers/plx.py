from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.sql_service import execute_and_observe

router = APIRouter()

class SqlRequest(BaseModel):
    session_id: str
    mind_id: str
    sql: str
    auto_learn: bool = True

@router.post("/query")
async def run_query(request: SqlRequest):
    try:
        return execute_and_observe(
            session_id=request.session_id,
            mind_id=request.mind_id,
            sql=request.sql,
            auto_learn=request.auto_learn
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
