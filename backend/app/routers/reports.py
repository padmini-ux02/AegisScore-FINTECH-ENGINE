from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.db.session import get_db
from app.db.models import PredictionRecord, User
from app.models.schemas import PredictionRequest
from app.services.report_generator import ReportGenerator
from app.services.ml_engine import ml_engine
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

def _get_record_data(record_id: int, db: Session) -> dict:
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
        
    # Reconstruct request inputs
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
    
    # Get predictions & explanation structures
    result = ml_engine.predict(req_inputs)
    
    return {
        "credit_score": record.credit_score,
        "risk_category": record.risk_category,
        "approval_probability": record.approval_probability,
        "default_probability": record.default_probability,
        "financial_health_score": record.financial_health_score,
        "inputs": req_inputs,
        "explainable_ai": result["explainable_ai"]
    }

@router.get("/download/pdf/{record_id}")
def download_pdf(record_id: int, db: Session = Depends(get_db)):
    data = _get_record_data(record_id, db)
    pdf_buffer = ReportGenerator.generate_pdf(data)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=credit_report_{record_id}.pdf"}
    )

@router.get("/download/excel/{record_id}")
def download_excel(record_id: int, db: Session = Depends(get_db)):
    data = _get_record_data(record_id, db)
    excel_buffer = ReportGenerator.generate_excel(data)
    
    return Response(
        content=excel_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=credit_report_{record_id}.xlsx"}
    )

@router.get("/download/csv/{record_id}")
def download_csv(record_id: int, db: Session = Depends(get_db)):
    data = _get_record_data(record_id, db)
    csv_buffer = ReportGenerator.generate_csv(data)
    
    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=credit_report_{record_id}.csv"}
    )


