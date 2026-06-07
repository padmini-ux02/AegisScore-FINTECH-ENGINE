from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)  # "admin" or "user"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    predictions = relationship("PredictionRecord", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class PredictionRecord(Base):
    __tablename__ = "prediction_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Customer Demographics
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    marital_status = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    employment_duration = Column(Float, nullable=False)
    education_level = Column(String, nullable=False)
    
    # Financial Details
    annual_income = Column(Float, nullable=False)
    monthly_income = Column(Float, nullable=False)
    existing_loans_balance = Column(Float, nullable=False)
    debt_to_income_ratio = Column(Float, nullable=False)
    credit_utilization_ratio = Column(Float, nullable=False)
    savings_amount = Column(Float, nullable=False)
    investments = Column(Float, nullable=False)
    
    # Credit History
    number_of_active_loans = Column(Integer, nullable=False)
    previous_loan_records = Column(Integer, nullable=False)
    missed_payments = Column(Integer, nullable=False)
    payment_history_ratio = Column(Float, nullable=False)
    
    # Model Output Predictions
    credit_score = Column(Integer, nullable=False)
    default_probability = Column(Float, nullable=False)
    approval_probability = Column(Float, nullable=False)
    financial_health_score = Column(Float, nullable=False)
    risk_category = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="predictions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="audit_logs")
