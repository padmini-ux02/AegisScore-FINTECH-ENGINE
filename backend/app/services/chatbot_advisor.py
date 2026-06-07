import re
import httpx
from typing import List, Tuple
from app.core.config import settings

class ChatbotAdvisor:
    def __init__(self):
        pass

    def get_response(self, user_message: str, client_api_key: str = "") -> Tuple[str, List[str]]:
        """
        Gets response from Gemini API (via HTTP request) or local expert advisor engine.
        Returns (reply, list_of_suggested_follow_up_questions).
        """
        message_lower = user_message.lower().strip()
        
        # Decide which API key to use (prefer client key from frontend, fallback to backend environment variables)
        api_key = client_api_key.strip() or settings.GEMINI_API_KEY.strip()
        
        if api_key:
            reply = self._query_gemini_api(api_key, user_message)
            if reply:
                suggestions = self._generate_suggestions_for_query(message_lower)
                return reply, suggestions
                
        # If Gemini is not set up or query failed, use the advanced local expert system
        return self._local_expert_response(message_lower)

    def _query_gemini_api(self, api_key: str, message: str) -> str:
        """
        Queries Gemini 1.5 Flash using direct HTTP post.
        Avoids external SDK requirements and works out of the box.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        system_prompt = (
            "You are 'AegisScore Advisor', an expert financial assistant specialized in credit scoring, "
            "financial risk assessment, and loan eligibility. Provide concise, professional, and actionable "
            "financial advice. Keep answers under 3 paragraphs. Highlight key points in bold (**). "
            "Include a friendly, professional tone. Do not give official legal or investment advice, "
            "but explain concepts clearly. Answer the user's message: "
        )
        
        payload = {
            "contents": [{
                "parts": [{"text": system_prompt + message}]
            }]
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(url, json=payload, timeout=20.0)
                if response.status_code == 200:
                    res_json = response.json()
                    candidates = res_json.get("candidates", [])
                    if candidates:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                print(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
        return ""

    def _local_expert_response(self, message: str) -> Tuple[str, List[str]]:
        """
        Advanced local expert rule-based responder covering 20+ credit and financial topics.
        """
        # 1. Greetings & Meta
        if any(w in message for w in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "who are you", "what is your name"]):
            reply = (
                "Hello! I am your **AegisScore AI Financial Advisor**. I am designed to assist you with credit score simulations, "
                "risk assessment explanation, debt-to-income analysis, and custom credit-improvement strategies.\n\n"
                "You can ask me questions like:\n"
                "- *'How can I improve my credit score?'*\n"
                "- *'What is credit utilization ratio?'*\n"
                "- *'What is the difference between a hard and soft credit check?'*"
            )
            suggestions = [
                "How do I improve my credit score?",
                "What is credit utilization ratio?",
                "How does debt-to-income ratio affect loans?"
            ]
            return reply, suggestions

        # 2. How to Improve Credit Score
        if any(w in message for w in ["improve", "increase", "raise", "boost", "repair", "fix", "grow"]) and any(w in message for w in ["score", "credit", "rating"]):
            reply = (
                "Improving your credit score requires consistent financial habits. Here is the **AegisScore Action Plan**:\n\n"
                "1. **Pay on time, every time:** Payment history accounts for **35%** of your score. Automate your monthly minimums.\n"
                "2. **Reduce Credit Utilization:** Keep balances below **30%** of your limit. Keeping it under **10%** is optimal.\n"
                "3. **Do not close old accounts:** The length of your credit history accounts for **15%** of your score. Keep your oldest cards open.\n"
                "4. **Limit new credit inquiries:** Each hard inquiry drops your score by a few points temporarily. Apply only when necessary.\n"
                "5. **Monitor your credit report:** Check for inaccuracies and file disputes if you find errors."
            )
            suggestions = [
                "What is credit utilization ratio?",
                "What is a hard vs soft inquiry?",
                "How long does it take to repair bad credit?"
            ]
            return reply, suggestions

        # 3. Credit Utilization (CUR)
        if any(w in message for w in ["utilization", "cur", "card balance", "limit", "card usage"]):
            reply = (
                "**Credit Utilization Ratio (CUR)** measures how much of your total available credit limit you are using. "
                "It is calculated as: `(Total Card Balances / Total Available Credit Limits) * 100`.\n\n"
                "Lenders see a utilization rate above **30%** as a warning sign of credit dependency and risk. "
                "For example, if you have a limit of $10,000, keeping your total balances below $3,000 is good, "
                "while keeping them below $1,000 is excellent. Paying your balance early (before the statement closing date) "
                "is a great way to keep reported utilization low."
            )
            suggestions = [
                "Does paying early reduce credit utilization?",
                "How do I increase my credit limit?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 4. Debt to Income Ratio (DTI)
        if any(w in message for w in ["dti", "debt to income", "debt-to-income", "debt ratio"]):
            reply = (
                "**Debt-to-Income (DTI) Ratio** is a key risk metric lenders use to assess your monthly repayment capacity. "
                "It is calculated by dividing your total monthly debt payments (loans, card minimums, housing) by your gross monthly income.\n\n"
                "Lenders evaluate DTI according to these thresholds:\n"
                "- **35% or less:** Excellent. You represent a highly manageable debt profile.\n"
                "- **36% to 49%:** Moderate. Qualification is possible, but terms may be less favorable.\n"
                "- **50% or higher:** High Risk. Lenders are hesitant to approve new credit because you have no financial margin."
            )
            suggestions = [
                "How can I lower my DTI ratio?",
                "How does DTI affect mortgage rates?",
                "What is a safe loan size?"
            ]
            return reply, suggestions

        # 5. Missed Payments & Defaults
        if any(w in message for w in ["missed", "late", "delinquent", "default", "bankruptcy", "payment history"]):
            reply = (
                "**Missed and late payments** have the most significant negative impact on your credit score, as payment history "
                "constitutes **35%** of the total score computation.\n\n"
                "- **30 Days Late:** Reported to credit bureaus; can drop a good score by 50 to 100 points.\n"
                "- **90+ Days Late:** Considered a severe delinquency, indicating a high probability of default.\n"
                "- **Bankruptcy / Charge-off:** Remains on your credit file for **7 to 10 years**.\n\n"
                "**To recover:** Bring past-due accounts current immediately, request a 'goodwill deletion' for one-off mistakes, "
                "and set up automatic calendar alerts."
            )
            suggestions = [
                "How long do missed payments stay on my credit report?",
                "Can I dispute a late payment?",
                "How is payment history ratio calculated?"
            ]
            return reply, suggestions

        # 6. Credit Score Ranges
        if any(w in message for w in ["range", "scale", "good score", "bad score", "score meaning", "rating"]):
            reply = (
                "Standard credit scores range from **300 to 850**:\n\n"
                "- 🟢 **800 - 850 (Excellent):** Preferred borrower status. Low interest rates, fast approvals, high credit limits.\n"
                "- 🟢 **740 - 799 (Very Good):** Favorable terms. Low rates and standard approvals.\n"
                "- 🟡 **670 - 739 (Good/Fair):** Average creditworthiness. Moderate interest rates.\n"
                "- 🟠 **580 - 669 (Fair/Moderate Risk):** Below average. Higher interest rates or security deposits may be required.\n"
                "- 🔴 **300 - 579 (Poor/High Risk):** Subprime rating. High probability of loan rejection; secured credit cards required."
            )
            suggestions = [
                "How is my risk category calculated?",
                "How do I improve my credit score?",
                "How long does it take to repair bad credit?"
            ]
            return reply, suggestions

        # 7. Inquiry Types (Hard vs Soft)
        if any(w in message for w in ["inquiry", "inquiries", "pull", "credit check"]):
            reply = (
                "It is critical to distinguish between **Hard Inquiries** and **Soft Inquiries**:\n\n"
                "- **Hard Inquiry:** Occurs when a lender pulls your credit report to make a lending decision (e.g., mortgage, card, auto loan). "
                "This drops your score by 3-5 points temporarily and remains visible for **2 years**.\n"
                "- **Soft Inquiry:** Occurs during background checks (employment, tenant checks) or when you check your own score. "
                "**Soft inquiries have zero impact** on your credit score and are not visible to lenders."
            )
            suggestions = [
                "Does checking my own score hurt it?",
                "How do I remove unauthorized hard inquiries?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 8. Savings & Investments
        if any(w in message for w in ["saving", "investment", "cash", "reserves", "wealth"]):
            reply = (
                "Although traditional credit reports do not list your liquid bank savings, **savings and investment accounts** "
                "play an essential role in loan approvals and risk assessments.\n\n"
                "Having robust cash reserves acts as a **collateral buffer**. If your income drops or you encounter an emergency, "
                "your savings ensure you can continue to pay your debts on time. This prevents delinquencies and improves your "
                "overall financial health index."
            )
            suggestions = [
                "What is a healthy savings-to-income ratio?",
                "How much emergency fund do I need?",
                "How does DTI affect loans?"
            ]
            return reply, suggestions

        # 9. Interest Rates & APR
        if any(w in message for w in ["interest", "rate", "apr", "cost of debt"]):
            reply = (
                "**APR (Annual Percentage Rate)** represents the annual cost of borrowing money, including interest and fees. "
                "Your credit score is the single most important factor determining your APR:\n\n"
                "- An **Excellent** credit score (750+) might qualify you for a **5% - 7%** APR on auto loans.\n"
                "- A **Poor** credit score (under 580) might result in a **15% - 25%** APR or complete rejection.\n\n"
                "Over a 30-year mortgage, a high credit score can save you **hundreds of thousands of dollars** in interest."
            )
            suggestions = [
                "What is a good credit card APR?",
                "How can I refinance a high-interest loan?",
                "Explain the credit score ranges."
            ]
            return reply, suggestions

        # 10. Loan Underwriting & Approval
        if any(w in message for w in ["loan", "approval", "mortgage", "qualify", "eligibility", "underwrite"]):
            reply = (
                "**Loan Underwriting** is the process where a lender evaluates your risk profile to approve or deny a loan. "
                "Lenders evaluate the '5 Cs of Credit':\n\n"
                "1. **Character:** Credit history and payment consistency.\n"
                "2. **Capacity:** Debt-to-income (DTI) ratio and cash flow.\n"
                "3. **Capital:** Your savings, investments, and down payment size.\n"
                "4. **Collateral:** Assets securing the loan (e.g., house, car).\n"
                "5. **Conditions:** Loan purpose, size, and current economic rates."
            )
            suggestions = [
                "What is a safe loan-to-value ratio?",
                "How does DTI affect mortgage rates?",
                "How is my risk category calculated?"
            ]
            return reply, suggestions

        # 11. Fraud & Inaccuracies
        if any(w in message for w in ["fraud", "theft", "stolen", "dispute", "error", "wrong", "inaccuracy"]):
            reply = (
                "If you detect errors on your credit report (e.g., accounts you didn't open, wrong delinquency records, "
                "or duplicate debts), you must **file a dispute** with the reporting bureau (Equifax, Experian, or TransUnion).\n\n"
                "**How to dispute:**\n"
                "1. Download your official report from AnnualCreditReport.com.\n"
                "2. Identify the incorrect record and gather supporting documentation (proof of payment, account closures).\n"
                "3. File a dispute online or via mail. The bureau has **30 days** to investigate and remove inaccurate data."
            )
            suggestions = [
                "How do I protect my identity from fraud?",
                "What is a credit freeze?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 12. Credit Card Types (Secured Cards)
        if any(w in message for w in ["secured", "unsecured", "card type", "rewards card"]):
            reply = (
                "If you are rebuilding credit or starting from scratch, a **Secured Credit Card** is the most effective tool. "
                "Unlike a standard card, a secured card requires a cash security deposit (e.g., $200), which usually acts as your credit limit.\n\n"
                "Using the card for small monthly purchases and paying the balance in full every month builds a positive payment history "
                "reported to the bureaus. After 8-12 months, lenders will often graduate you to an **Unsecured** card and refund your deposit."
            )
            suggestions = [
                "How do I apply for a secured card?",
                "Does paying interest build credit?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 13. Co-signing
        if any(w in message for w in ["cosign", "co-sign", "guarantor"]):
            reply = (
                "**Co-signing** a loan means you are taking full legal and financial responsibility for the debt alongside the primary borrower. "
                "If the primary borrower misses a payment or defaults, it will **directly damage your credit score** and the lender can sue you for repayment.\n\n"
                "Co-signing also increases your personal DTI ratio, which can limit your ability to qualify for your own loans. Only co-sign for trusted individuals "
                "where you have a clear repayment backup plan."
            )
            suggestions = [
                "Can a co-signer be removed from a loan?",
                "What is the difference between a co-signer and joint account?",
                "How does DTI affect loans?"
            ]
            return reply, suggestions

        # 14. Financial Planning & Budgeting
        if any(w in message for w in ["budget", "plan", "expense", "salary", "save money"]):
            reply = (
                "Robust financial planning underpins a strong credit profile. Try implementing the **50/30/20 Budgeting Rule**:\n\n"
                "- **50% Needs:** Housing, groceries, utility bills, insurance, and minimum debt payments.\n"
                "- **30% Wants:** Dining out, hobbies, subscriptions, travel, and shopping.\n"
                "- **20% Savings & Debt Acceleration:** Emergency funds, index investments, and paying down high-interest credit card debt."
            )
            suggestions = [
                "How much emergency fund do I need?",
                "What is a safe debt-to-income ratio?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 15. Credit History Age
        if any(w in message for w in ["age", "duration", "oldest", "history length"]):
            reply = (
                "The **Length of Credit History** accounts for **15%** of your total credit score. It takes into account:\n"
                "- The average age of all your open accounts.\n"
                "- The age of your oldest and newest account.\n"
                "- How long it has been since you used certain accounts.\n\n"
                "An older credit history indicates to lenders that you have extensive experience managing credit. **Tip:** Avoid closing "
                "old, paid-off credit cards unless they carry high annual fees, as doing so reduces your average account age."
            )
            suggestions = [
                "Does closing an account lower my score?",
                "How is my credit score calculated?",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 16. AegisScore Engine Details
        if any(w in message for w in ["aegisscore", "algorithm", "system", "explainable", "shap", "lime"]):
            reply = (
                "**AegisScore** uses advanced machine learning classifiers (such as CatBoost, XGBoost, and Random Forest) "
                "to predict loan default probability and creditworthiness.\n\n"
                "We provide **Explainable AI (XAI)** using **SHAP (Shapley Additive exPlanations)** and **LIME** to display "
                "the exact feature contribution for every prediction. This means you can see exactly which financial metrics (e.g., high CUR, DTI, savings) "
                "increased or decreased your credit rating, ensuring complete algorithmic transparency."
            )
            suggestions = [
                "How is my credit score calculated?",
                "Explain SHAP and LIME in simple terms.",
                "How do I improve my credit score?"
            ]
            return reply, suggestions

        # 17. Default Fallback
        reply = (
            "I understand you are asking about financial metrics or credit risk. AegisScore evaluates several critical variables:\n\n"
            "1. **Debt-to-Income (DTI)** and **Credit Utilization (CUR)** ratios.\n"
            "2. **Missed Payments** counts and **Payment History Ratio**.\n"
            "3. Liquid reserves like **Savings** and **Investments**.\n\n"
            "Please ask me a specific question such as *'How do I lower my utilization?'* or *'What is a good DTI ratio?'*, and I will explain in detail.\n\n"
            "> **Tip:** You can enter your own **Google Gemini API Key** by clicking the **Gear (⚙️) icon** in the header of this Chatbot Widget to unlock full, unrestricted AI advice!"
        )
        suggestions = [
            "How do I improve my credit score?",
            "What is credit utilization ratio?",
            "How does debt-to-income ratio affect loans?",
            "Explain the credit score ranges (300-850)."
        ]
        return reply, suggestions

    def _generate_suggestions_for_query(self, message: str) -> List[str]:
        if "utilization" in message or "cur" in message:
            return ["Does paying early reduce credit utilization?", "How to increase my credit limit?", "How do I improve my score?"]
        elif "dti" in message or "debt" in message:
            return ["How can I lower my DTI ratio?", "How does DTI affect mortgage rates?", "What is a safe loan size?"]
        elif "missed" in message or "late" in message or "payment" in message:
            return ["How long do missed payments stay on credit report?", "Can I request a goodwill deletion?", "How to automate payments?"]
        elif "inquiry" in message or "pull" in message or "check" in message:
            return ["Does checking my own score hurt it?", "How long do inquiries stay on report?", "How to improve my credit score?"]
        elif "secured" in message:
            return ["How do I apply for a secured card?", "Does paying interest build credit?", "Explain credit score ranges."]
        else:
            return ["How do I improve my credit score?", "What is credit utilization ratio?", "How does DTI affect loans?"]

chatbot_advisor = ChatbotAdvisor()

