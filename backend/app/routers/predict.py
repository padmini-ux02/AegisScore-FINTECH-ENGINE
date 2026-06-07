from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import PredictionRecord, User, AuditLog
from app.models.schemas import PredictionRequest, PredictionResponse, ExplainableAI
from app.services.ml_engine import ml_engine
from app.routers.auth import get_current_user

router = APIRouter(prefix="/predict", tags=["Predictions"])

# Optional auth dependency helper
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login-form", auto_error=False)

def get_optional_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return db.query(User).filter(User.email == email).first()
    except (JWTError, Exception):
        return None

@router.post("", response_model=PredictionResponse)
def create_prediction(
    req: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    print(f"\n--- PREDICT REQUEST RECEIVED ---")
    print(f"Age: {req.age}, Income: {req.annual_income}, Missed: {req.missed_payments}, DTI: {req.debt_to_income_ratio}, CUR: {req.credit_utilization_ratio}")
    # Call ML inference
    result = ml_engine.predict(req)
    print(f"Prediction Result -> Score: {result['credit_score']}, Approval: {result['approval_probability']:.3f}, Default: {result['default_probability']:.3f}")
    
    # Save record to database if user is authenticated
    user_id = current_user.id if current_user else None
    
    record = PredictionRecord(
        user_id=user_id,
        # Demographics
        age=req.age,
        gender=req.gender,
        marital_status=req.marital_status,
        employment_type=req.employment_type,
        employment_duration=req.employment_duration,
        education_level=req.education_level,
        # Financials
        annual_income=req.annual_income,
        monthly_income=req.monthly_income,
        existing_loans_balance=req.existing_loans_balance,
        debt_to_income_ratio=req.debt_to_income_ratio,
        credit_utilization_ratio=req.credit_utilization_ratio,
        savings_amount=req.savings_amount,
        investments=req.investments,
        # Credit history
        number_of_active_loans=req.number_of_active_loans,
        previous_loan_records=req.previous_loan_records,
        missed_payments=req.missed_payments,
        payment_history_ratio=req.payment_history_ratio,
        # Predictions
        credit_score=result["credit_score"],
        default_probability=result["default_probability"],
        approval_probability=result["approval_probability"],
        financial_health_score=result["financial_health_score"],
        risk_category=result["risk_category"]
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Audit log
    log_details = f"Score: {record.credit_score}, Risk: {record.risk_category}"
    if user_id:
        log_details += f" for User ID: {user_id}"
    else:
        log_details += " (Anonymous Simulator Query)"
        
    audit_log = AuditLog(
        user_id=user_id,
        action="PREDICT",
        details=log_details
    )
    db.add(audit_log)
    db.commit()
    
    # Return formatted response
    return PredictionResponse(
        id=record.id,
        inputs=req,
        credit_score=record.credit_score,
        approval_probability=record.approval_probability,
        default_probability=record.default_probability,
        financial_health_score=record.financial_health_score,
        risk_category=record.risk_category,
        explainable_ai=result["explainable_ai"],
        created_at=record.created_at
    )

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    # Fetch user's history
    records = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == current_user.id
    ).order_by(PredictionRecord.created_at.desc()).limit(limit).all()
    
    history_response = []
    for r in records:
        # Re-run explainability on historical records dynamically or use simulator details
        req_inputs = PredictionRequest(
            age=r.age,
            gender=r.gender,
            marital_status=r.marital_status,
            employment_type=r.employment_type,
            employment_duration=r.employment_duration,
            education_level=r.education_level,
            annual_income=r.annual_income,
            monthly_income=r.monthly_income,
            existing_loans_balance=r.existing_loans_balance,
            debt_to_income_ratio=r.debt_to_income_ratio,
            credit_utilization_ratio=r.credit_utilization_ratio,
            savings_amount=r.savings_amount,
            investments=r.investments,
            number_of_active_loans=r.number_of_active_loans,
            previous_loan_records=r.previous_loan_records,
            missed_payments=r.missed_payments,
            payment_history_ratio=r.payment_history_ratio
        )
        
        # We calculate SHAP/LIME dynamically for history retrieval
        result = ml_engine.predict(req_inputs)
        
        history_response.append(PredictionResponse(
            id=r.id,
            inputs=req_inputs,
            credit_score=r.credit_score,
            approval_probability=r.approval_probability,
            default_probability=r.default_probability,
            financial_health_score=r.financial_health_score,
            risk_category=r.risk_category,
            explainable_ai=result["explainable_ai"],
            created_at=r.created_at
        ))
        
    return history_response

@router.get("/history/{record_id}", response_model=PredictionResponse)
def get_single_prediction(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(PredictionRecord).filter(
        PredictionRecord.id == record_id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
        
    # Check authorization (admin can view all, user can only view their own)
    if record.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this record")
        
    req_inputs = PredictionRequest(
        age=record.age,
        gender=record.gender,
        marital_status=record.marital_status,
        employment_type=record.employment_type,
        employment_duration=record.employment_duration,
        education_level=record.education_level,
        annual_income=record.annual_income,
        monthly_income=record.monthly_income,
        existing_loans_balance=record.existing_loans_balance,
        debt_to_income_ratio=record.debt_to_income_ratio,
        credit_utilization_ratio=record.credit_utilization_ratio,
        savings_amount=record.savings_amount,
        investments=record.investments,
        number_of_active_loans=record.number_of_active_loans,
        previous_loan_records=record.previous_loan_records,
        missed_payments=record.missed_payments,
        payment_history_ratio=record.payment_history_ratio
    )
    
    result = ml_engine.predict(req_inputs)
    
    return PredictionResponse(
        id=record.id,
        inputs=req_inputs,
        credit_score=record.credit_score,
        approval_probability=record.approval_probability,
        default_probability=record.default_probability,
        financial_health_score=record.financial_health_score,
        risk_category=record.risk_category,
        explainable_ai=result["explainable_ai"],
        created_at=record.created_at
    )
