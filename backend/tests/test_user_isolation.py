import pytest
from app.services.dataset_provider import get_repository
from app.services.affordability_agent.data.twin_factory import FinancialTwinFactory
from app.services.affordability_agent.data.repository import DataRepository
import os

def test_user_data_isolation():
    repo = get_repository()
    
    # Pick three known users from the dataset
    user_a = "user_10"
    user_b = "user_26"
    user_c = "user_02"
    
    events_a = repo.get_events(user_a)
    events_b = repo.get_events(user_b)
    events_c = repo.get_events(user_c)
    
    # Assert isolation (all events belong to requested user)
    assert all(e.user_id == user_a for e in events_a)
    assert all(e.user_id == user_b for e in events_b)
    assert all(e.user_id == user_c for e in events_c)
    
    # Verify no overlaps between event pools
    event_ids_a = {e.event_id for e in events_a}
    event_ids_b = {e.event_id for e in events_b}
    event_ids_c = {e.event_id for e in events_c}
    
    assert event_ids_a.isdisjoint(event_ids_b)
    assert event_ids_b.isdisjoint(event_ids_c)
    assert event_ids_a.isdisjoint(event_ids_c)

    # Validate profiles
    profile_a = repo.get_profile(user_a)
    profile_b = repo.get_profile(user_b)
    profile_c = repo.get_profile(user_c)
    assert profile_a.user_id == user_a
    assert profile_b.user_id == user_b
    assert profile_c.user_id == user_c

def test_twin_factory_cross_user_contamination():
    repo = get_repository()
    factory = FinancialTwinFactory(repo)
    
    # Test building a valid twin
    user_id = "user_26"
    twin = factory.build(user_id, repo.get_events(user_id)[0].event_date)
    assert twin.user_id == user_id
    
    # Verify DataRepository ValueError on invalid user profile
    with pytest.raises(ValueError, match="Profile not found"):
        repo.get_profile("user_does_not_exist")

    # Manually introduce contamination to test safety mechanism
    class MockRepo:
        def __init__(self):
            self.rates_df = repo.rates_df
        def get_profile(self, uid):
            return repo.get_profile(uid)
        def get_events(self, uid):
            return repo.get_events("user_27") # Returns wrong user's events
        def get_messages_for_event(self, ev_id):
            return []
        def get_images_for_event(self, ev_id):
            return []
            
    bad_factory = FinancialTwinFactory(MockRepo())
    bad_factory._currency_converter = factory._currency_converter
    
    with pytest.raises(ValueError, match="Cross-user contamination detected"):
        bad_factory.build(user_id, twin.request_date)
