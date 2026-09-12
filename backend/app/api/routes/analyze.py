from fastapi import APIRouter
from app.models.decisions import AnalyzeRequest, AnalyzeResponse
from app.services.demo_engine import DemoFinancialDecisionEngine

router = APIRouter()

# Using the demo engine; swap for HackerRankFinancialDecisionEngine when ready
_engine = DemoFinancialDecisionEngine()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze a financial request and return a full decision response.

    NOTE: Currently backed by DemoFinancialDecisionEngine (DEMO ONLY).
    Replace engine with HackerRankFinancialDecisionEngine for real analysis.
    """
    return await _engine.analyze(request)
