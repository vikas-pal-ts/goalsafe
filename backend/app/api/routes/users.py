from fastapi import APIRouter
from app.services.dataset_provider import get_repository

router = APIRouter()

@router.get("")
def get_users():
    repo = get_repository()
    return repo.get_all_users()
