from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config  # Load env vars

app = FastAPI(title="your-ds-agent API", description="Expert Knowledge Persistence System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import execute, plx, mind

app.include_router(execute.router, prefix="/execute", tags=["Execution"])
app.include_router(plx.router, prefix="/plx", tags=["PLX"])
app.include_router(mind.router, prefix="/mind", tags=["Mind"])

@app.get("/")
def root():
    return {"status": "healthy", "service": "your-ds-agent-api"}
