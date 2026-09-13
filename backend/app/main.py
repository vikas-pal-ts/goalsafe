from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.analyze import router as analyze_router
from app.api.routes.requests import router as requests_router
from app.api.routes.expenses import router as expenses_router
from app.api.routes.goals import router as goals_router
from app.api.routes.users import router as users_router
from app.api.routes.home import router as home_router

from app.db.database import Base, engine
from app.models.request import FinancialRequest
from app.models.goals import Goal

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GoalSafe API",
    description="AI-powered financial affordability and goal decision assistant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow local Next.js dev server and common ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(requests_router, prefix="/api/requests", tags=["requests"])
app.include_router(expenses_router, prefix="/api/expenses", tags=["expenses"])
app.include_router(goals_router, prefix="/api/goals", tags=["goals"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(home_router, prefix="/api/home", tags=["home"])
