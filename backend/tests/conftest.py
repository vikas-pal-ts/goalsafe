import os
import pytest

@pytest.fixture(autouse=True)
def set_env_vars():
    os.environ["MONEYMIND_USER_ID"] = "user_26"
