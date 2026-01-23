from fastapi import APIRouter, HTTPException
from models import ExecutePythonRequest, ExecutePythonResponse
from services.repl_service import execute_cell

router = APIRouter()

@router.post("/python", response_model=ExecutePythonResponse)
async def run_python(request: ExecutePythonRequest):
    try:
        result = execute_cell(
            session_id=request.session_id,
            cell_id=request.cell_id,
            code=request.code,
            cell_order=request.cell_order,
            mind_id=request.mind_id,
            auto_learn=request.auto_learn
        )
        return ExecutePythonResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
