import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.session import Base, engine, SessionLocal
from app.db.models import User

# Use test database
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # clean up tables
    db.query(User).delete()
    db.commit()
    db.close()
    yield
    # Cleanup after all tests
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_auth_register_login(client):
    # Register
    signup_data = {
        "email": "testuser@creditguard.ai",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "user"
    }
    response = client.post("/api/v1/auth/register", json=signup_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == signup_data["email"]
    assert data["full_name"] == signup_data["full_name"]
    assert "id" in data
    
    # Register duplicate email should fail
    response_dup = client.post("/api/v1/auth/register", json=signup_data)
    assert response_dup.status_code == 400
    
    # Login
    login_data = {
        "email": "testuser@creditguard.ai",
        "password": "testpassword123"
    }
    response_login = client.post("/api/v1/auth/login", json=login_data)
    assert response_login.status_code == 200
    login_result = response_login.json()
    assert "access_token" in login_result
    assert login_result["token_type"] == "bearer"
    assert login_result["user"]["email"] == signup_data["email"]

def test_predict_endpoint_anonymous(client):
    payload = {
        "age": 35,
        "gender": "Male",
        "marital_status": "Married",
        "employment_type": "Salaried",
        "employment_duration": 5.5,
        "education_level": "Bachelor",
        "annual_income": 85000.0,
        "monthly_income": 7083.0,
        "existing_loans_balance": 15000.0,
        "debt_to_income_ratio": 0.25,
        "credit_utilization_ratio": 0.18,
        "savings_amount": 12000.0,
        "investments": 25000.0,
        "number_of_active_loans": 1,
        "previous_loan_records": 3,
        "missed_payments": 0,
        "payment_history_ratio": 1.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "credit_score" in data
    assert 300 <= data["credit_score"] <= 850
    assert "risk_category" in data
    assert "explainable_ai" in data
    assert "shap_waterfall" in data["explainable_ai"]

def test_chatbot_endpoint(client):
    payload = {"message": "How do I improve my credit score?"}
    response = client.post("/api/v1/chatbot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["suggested_questions"]) > 0
    assert any("score" in q.lower() for q in data["suggested_questions"])
