"""
Abstract interface for the financial decision engine.

The initial implementation is DemoFinancialDecisionEngine.
Later, HackerRankFinancialDecisionEngine connects to the real deterministic solver.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.decisions import AnalyzeRequest, AnalyzeResponse


class FinancialDecisionEngine(ABC):
    """
    Abstract interface for the GoalSafe financial engine.

    Implementations:
      - DemoFinancialDecisionEngine  (current — DEMO ONLY)
      - HackerRankFinancialDecisionEngine  (future — real solver integration)
    """

    @abstractmethod
    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """Analyze a financial request and return a full decision response."""
        ...
