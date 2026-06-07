import os
import numpy as np
import pandas as pd

def generate_synthetic_data(num_samples=5000, random_seed=42):
    """
    Generates realistic synthetic credit risk data.
    """
    np.random.seed(random_seed)
    
    # 1. Demographics
    age = np.random.randint(18, 75, size=num_samples)
    gender = np.random.choice(["Male", "Female", "Other"], size=num_samples, p=[0.48, 0.48, 0.04])
    marital_status = np.random.choice(["Single", "Married", "Divorced", "Widowed"], size=num_samples, p=[0.4, 0.45, 0.12, 0.03])
    education_level = np.random.choice(["High School", "Bachelor", "Master", "PhD"], size=num_samples, p=[0.35, 0.45, 0.15, 0.05])
    
    # Employment
    employment_type = []
    employment_duration = []
    for a in age:
        if a < 22:
            emp = np.random.choice(["Salaried", "Self-Employed", "Unemployed"], p=[0.2, 0.1, 0.7])
        elif a > 65:
            emp = np.random.choice(["Retired", "Self-Employed", "Salaried"], p=[0.8, 0.15, 0.05])
        else:
            emp = np.random.choice(["Salaried", "Self-Employed", "Unemployed"], p=[0.75, 0.2, 0.05])
        
        employment_type.append(emp)
        
        if emp == "Unemployed":
            duration = 0.0
        elif emp == "Retired":
            duration = float(np.random.randint(20, 45))
        else:
            max_dur = min(a - 18, 40)
            duration = round(np.random.uniform(0.5, max_dur), 1)
        employment_duration.append(duration)
        
    employment_type = np.array(employment_type)
    employment_duration = np.array(employment_duration)

    # 2. Financial Details
    annual_income = []
    for emp, edu, a in zip(employment_type, education_level, age):
        # Base income on education, age, and employment
        base = 25000
        if edu == "Bachelor": base = 45000
        elif edu == "Master": base = 65000
        elif edu == "PhD": base = 85000
        
        if emp == "Unemployed":
            inc = np.random.uniform(5000, 15000)
        elif emp == "Retired":
            inc = np.random.uniform(20000, 50000)
        else:
            # Scale with age (experience proxy)
            age_factor = 1 + (a - 18) * 0.03
            inc = base * age_factor * np.random.uniform(0.7, 1.5)
            
        annual_income.append(round(inc, 2))
    
    annual_income = np.array(annual_income)
    monthly_income = np.round(annual_income / 12.0, 2)
    
    # Savings and Investments (highly correlated with income and age)
    savings_amount = []
    investments = []
    for inc, a in zip(annual_income, age):
        savings_pct = np.random.uniform(0.02, 0.25)
        # older people have accumulated more savings
        accumulation_factor = (a - 18) * 0.2 + 1.0
        savings = inc * savings_pct * accumulation_factor * np.random.uniform(0.5, 1.5)
        savings_amount.append(round(savings, 2))
        
        inv_pct = np.random.uniform(0.0, 0.3)
        inv = inc * inv_pct * accumulation_factor * np.random.uniform(0.3, 1.5)
        investments.append(round(inv, 2))
        
    savings_amount = np.array(savings_amount)
    investments = np.array(investments)
    
    # 3. Credit History
    number_of_active_loans = np.random.choice([0, 1, 2, 3, 4, 5], size=num_samples, p=[0.3, 0.35, 0.2, 0.1, 0.04, 0.01])
    
    # Existing loan amounts (if active loans > 0)
    existing_loans_balance = []
    for active, inc in zip(number_of_active_loans, annual_income):
        if active == 0:
            existing_loans_balance.append(0.0)
        else:
            # average loan size scales with income
            bal = active * inc * np.random.uniform(0.1, 0.6)
            existing_loans_balance.append(round(bal, 2))
    existing_loans_balance = np.array(existing_loans_balance)
    
    # Debt service to income (DTI) - monthly loan payments / monthly income
    dti = []
    for bal, active, m_inc in zip(existing_loans_balance, number_of_active_loans, monthly_income):
        if active == 0 or m_inc == 0:
            dti.append(0.0)
        else:
            # Assume 5-year repayment average (60 months) with 10% interest
            monthly_pmt = (bal * 1.1) / 60.0
            ratio = monthly_pmt / m_inc
            dti.append(round(min(ratio, 1.5), 3))
    dti = np.array(dti)
    
    # Credit Card Usage and Credit Utilization Ratio (CUR)
    credit_card_usage = np.random.choice(["No Cards", "Low", "Moderate", "High"], size=num_samples, p=[0.1, 0.3, 0.4, 0.2])
    cur = []
    for usage in credit_card_usage:
        if usage == "No Cards":
            cur.append(0.0)
        elif usage == "Low":
            cur.append(round(np.random.uniform(0.01, 0.15), 3))
        elif usage == "Moderate":
            cur.append(round(np.random.uniform(0.15, 0.45), 3))
        else:
            cur.append(round(np.random.uniform(0.45, 0.99), 3))
    cur = np.array(cur)
    
    # Payment History
    missed_payments = []
    previous_loan_records = np.random.randint(0, 8, size=num_samples)
    for prev, active in zip(previous_loan_records, number_of_active_loans):
        total_loans = prev + active
        if total_loans == 0:
            missed = 0
        else:
            # higher probability of missed payments if there are many loans
            prob_miss = min(0.05 + 0.05 * total_loans, 0.7)
            if np.random.random() < prob_miss:
                missed = np.random.choice([1, 2, 3, 4, 5], p=[0.5, 0.3, 0.12, 0.06, 0.02])
            else:
                missed = 0
        missed_payments.append(missed)
    missed_payments = np.array(missed_payments)
    
    payment_history_ratio = []
    for missed, prev in zip(missed_payments, previous_loan_records):
        if prev == 0 and missed == 0:
            payment_history_ratio.append(1.0)
        else:
            total_expected_pmts = (prev + 1) * 12
            ratio = max(0.0, 1.0 - (missed / total_expected_pmts))
            payment_history_ratio.append(round(ratio, 3))
    payment_history_ratio = np.array(payment_history_ratio)

    # 4. Generate Target Metrics (Heuristics with Noise)
    # Credit Score (300 to 850)
    # Let's start with a base score and apply penalties/bonuses
    base_score = 600
    scores = []
    for a, inc, cur_val, dti_val, missed, active, ratio in zip(age, annual_income, cur, dti, missed_payments, number_of_active_loans, payment_history_ratio):
        score = base_score
        
        # Age bonus (older people have more stable credit usually)
        score += int(min((a - 18) * 1.5, 50))
        
        # Income bonus
        score += int(min(np.log10(inc / 5000 + 1) * 30, 80))
        
        # Credit Utilization Ratio penalty (ideal is < 0.3, high utilization drops score)
        if cur_val < 0.1:
            score += 20
        elif cur_val <= 0.3:
            score += 40
        elif cur_val <= 0.6:
            score -= int((cur_val - 0.3) * 150)
        else:
            score -= int(100 + (cur_val - 0.6) * 300)
            
        # Debt to Income penalty (ideal DTI is < 0.36)
        if dti_val > 0.4:
            score -= int(min((dti_val - 0.4) * 250, 150))
        elif dti_val > 0.0 and dti_val <= 0.3:
            score += 20
            
        # Missed payments penalty (heavy impact)
        if missed > 0:
            score -= int(50 * missed + 30)
            
        # Payment history ratio bonus
        score += int((ratio - 0.8) * 150) if ratio > 0.8 else int((ratio - 0.8) * 300)
        
        # Active loans penalty if too high
        if active > 3:
            score -= 40
            
        # Add random noise
        score += int(np.random.normal(0, 15))
        
        # Clip score
        score = max(300, min(850, score))
        scores.append(score)
        
    scores = np.array(scores)
    
    # Default Probability (highly correlated with low credit score, high DTI, high missed payments)
    default_prob = []
    for sc, dti_val, missed, cur_val in zip(scores, dti, missed_payments, cur):
        # sigmoid base
        # normalized credit score: (850 - sc) / 550  => 0 (excellent) to 1 (poor)
        x = 5.0 * ((850.0 - sc) / 550.0) - 2.5
        x += dti_val * 2.0
        x += missed * 0.8
        x += cur_val * 1.5
        
        prob = 1.0 / (1.0 + np.exp(-x))
        default_prob.append(round(prob, 4))
    default_prob = np.array(default_prob)
    
    # Default label (1 if defaulted, 0 if not)
    default_label = []
    for prob in default_prob:
        default_label.append(1 if np.random.random() < prob else 0)
    default_label = np.array(default_label)
    
    # Loan Approval Probability (correlated with credit score, DTI, savings, and income)
    approval_prob = []
    for sc, dti_val, sav, inc in zip(scores, dti, savings_amount, annual_income):
        # higher score = higher approval
        # high DTI = rejection
        # higher savings/income relative to loan = higher approval
        x = 6.0 * ((sc - 300) / 550.0) - 2.0
        x -= dti_val * 4.0
        # savings buffer
        x += min(sav / 10000, 2.0)
        
        prob = 1.0 / (1.0 + np.exp(-x))
        approval_prob.append(round(prob, 4))
    approval_prob = np.array(approval_prob)
    
    # Approved label
    approved_label = []
    for prob in approval_prob:
        approved_label.append(1 if np.random.random() < prob else 0)
    approved_label = np.array(approved_label)
    
    # Financial Health Index (0 to 100)
    # Balanced blend of savings rate, DTI, credit score, investment rate, employment stability
    financial_health = []
    for sc, dti_val, sav, inc, inv, emp_dur in zip(scores, dti, savings_amount, annual_income, investments, employment_duration):
        health = 0.0
        health += ((sc - 300) / 550.0) * 35.0  # Credit score (max 35)
        health += max(0, (1.0 - dti_val)) * 25.0  # DTI (max 25)
        
        # Savings-to-income factor
        sav_ratio = sav / inc if inc > 0 else 0
        health += min(sav_ratio * 100, 15.0)  # Savings ratio (max 15)
        
        # Investment factor
        inv_ratio = inv / inc if inc > 0 else 0
        health += min(inv_ratio * 100, 15.0)  # Investment ratio (max 15)
        
        # Employment stability
        health += min(emp_dur * 0.5, 10.0)  # Employment (max 10)
        
        health = max(0.0, min(100.0, health + np.random.normal(0, 2)))
        financial_health.append(round(health, 2))
    financial_health = np.array(financial_health)
    
    # Risk Category mapping
    risk_categories = []
    for sc in scores:
        if sc >= 800:
            risk_categories.append("Excellent")
        elif sc >= 740:
            risk_categories.append("Good")
        elif sc >= 670:
            risk_categories.append("Moderate")
        elif sc >= 580:
            risk_categories.append("High Risk")
        else:
            risk_categories.append("Very High Risk")
            
    df = pd.DataFrame({
        "Age": age,
        "Gender": gender,
        "MaritalStatus": marital_status,
        "EmploymentType": employment_type,
        "EmploymentDuration": employment_duration,
        "EducationLevel": education_level,
        "AnnualIncome": annual_income,
        "MonthlyIncome": monthly_income,
        "ExistingLoansBalance": existing_loans_balance,
        "DebtToIncomeRatio": dti,
        "CreditUtilizationRatio": cur,
        "SavingsAmount": savings_amount,
        "Investments": investments,
        "NumberOfActiveLoans": number_of_active_loans,
        "PreviousLoanRecords": previous_loan_records,
        "MissedPayments": missed_payments,
        "PaymentHistoryRatio": payment_history_ratio,
        "CreditScore": scores,
        "DefaultProbability": default_prob,
        "Defaulted": default_label,
        "ApprovalProbability": approval_prob,
        "Approved": approved_label,
        "FinancialHealthScore": financial_health,
        "RiskCategory": risk_categories
    })
    
    return df

if __name__ == "__main__":
    # Ensure folder structure
    os.makedirs("c:/Users/saive/OneDrive/Documents/code alpha tasks/credit-card/ml/data", exist_ok=True)
    df = generate_synthetic_data(5000)
    output_path = "c:/Users/saive/OneDrive/Documents/code alpha tasks/credit-card/ml/data/credit_risk_dataset.csv"
    df.to_csv(output_path, index=False)
    print(f"Dataset generated with {len(df)} rows. Saved to {output_path}")
    print(df.head())
