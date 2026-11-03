import pytest
from app.database.init_db import init_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_database()
