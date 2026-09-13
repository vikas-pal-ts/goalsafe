import pathlib
import os

from app.services.affordability_agent.data.repository import DataRepository

from fastapi import HTTPException

def get_current_user_id() -> str:
    """Returns the configured demo user or fails with 400."""
    user_id = os.getenv("MONEYMIND_USER_ID")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required and MONEYMIND_USER_ID environment variable is missing.")
    return user_id

def resolve_and_validate_user_id(user_id: str = None) -> str:
    """Resolves the user_id (using fallback if needed) and validates it against the repo."""
    uid = user_id or get_current_user_id()
    repo = get_repository()
    try:
        repo.get_profile(uid)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid user_id: {uid}")
    return uid

# Find the dataset path
# The dataset is located at ../../../hackerrank-orchestrate-september26-main/dataset relative to the backend root
BACKEND_ROOT = pathlib.Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
PROJECT_ROOT = BACKEND_ROOT.parent.parent
DATASET_PATH = PROJECT_ROOT / "hackerrank-orchestrate-september26-main" / "dataset"

_repository_instance = None

def get_repository() -> DataRepository:
    """Returns a singleton instance of the DataRepository."""
    global _repository_instance
    if _repository_instance is None:
        _repository_instance = DataRepository(DATASET_PATH)
    return _repository_instance
