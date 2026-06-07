from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[str] = "user"  # "user" or "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)

# --- Prediction Schemas ---
class PredictionRequest(BaseModel):
    # Demographics
    age: int = Field(..., ge=18, le=100, description="Age in years")
    gender: str = Field(..., description="Gender (Male, Female, Other)")
    marital_status: str = Field(..., description="Marital status (Single, Married, Divorced, Widowed)")
    employment_type: str = Field(..., description="Employment type (Salaried, Self-Employed, Unemployed, Retired)")
    employment_duration: float = Field(..., ge=0, description="Years in current employment")
    education_level: str = Field(..., description="Highest education completed (High School, Bachelor, Master, PhD)")

    # Financials
    annual_income: float = Field(..., ge=0, description="Total annual income")
    monthly_income: float = Field(..., ge=0, description="Monthly income")
    existing_loans_balance: float = Field(..., ge=0, description="Total outstanding loans balance")
    debt_to_income_ratio: float = Field(..., ge=0, le=10.0, description="Monthly debt payments / monthly income")
    credit_utilization_ratio: float = Field(..., ge=0, le=1.0, description="Credit balance / credit limit")
    savings_amount: float = Field(..., ge=0, description="Total savings balance")
    investments: float = Field(..., ge=0, description="Total stock/bond/mutual-fund investments")

    # Credit History
    number_of_active_loans: int = Field(..., ge=0, description="Count of currently active loans")
    previous_loan_records: int = Field(..., ge=0, description="Count of historical closed loans")
    missed_payments: int = Field(..., ge=0, description="Count of payments missed in past 2 years")
    payment_history_ratio: float = Field(..., ge=0, le=1.0, description="Ratio of on-time payments to total payments")

class FeatureContribution(BaseModel):
    feature: str
    value: float
    contribution: float  # direction and magnitude of contribution (e.g. SHAP value)
    effect: str         # "positive" (improves creditworthiness) or "negative" (increases risk)

class ExplainableAI(BaseModel):
    shap_base_value: float
    shap_prediction_value: float
    shap_waterfall: List[FeatureContribution]
    lime_explanations: List[FeatureContribution]
    rejection_reasons: List[str]
    approval_reasons: List[str]

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    inputs: PredictionRequest
    credit_score: int
    approval_probability: float
    default_probability: float
    financial_health_score: float
    risk_category: str
    explainable_ai: ExplainableAI
    created_at: datetime

# --- Chatbot Schemas ---
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    suggested_questions: List[str]

# --- Admin & Analytics Schemas ---
class SystemMetrics(BaseModel):
    total_users: int
    total_predictions: int
    average_credit_score: float
    risk_distribution: Dict[str, int]
    api_hits_last_24h: int

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    details: str
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
