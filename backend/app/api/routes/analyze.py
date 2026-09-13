from fastapi import APIRouter
from app.models.decisions import AnalyzeRequest, AnalyzeResponse
from app.services.dataset_engine import HackerRankFinancialDecisionEngine

router = APIRouter()

# Using the real solver engine
_engine = HackerRankFinancialDecisionEngine()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze a financial request and return a full decision response.
    """
    return await _engine.analyze(request)
