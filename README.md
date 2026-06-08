<div align="center">
  <h1>🛡️ AegisScore</h1>
  <p><strong>Intelligent Credit Scoring & Lending Platform</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Machine%20Learning-XGBoost%20%7C%20LIME-FF6F00?style=for-the-badge&logo=scikit-learn" alt="ML" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  </p>
</div>

<br />

> **AegisScore** is an enterprise-grade fintech intelligence SaaS platform designed to predict, simulate, and explain customer creditworthiness and loan default risks. The system uses a machine learning ensemble alongside SHAP and LIME explainability models, wrapped in a stunning glassmorphic dashboard.

---

## ✨ Highlights & Features

| Feature | Description |
| :--- | :--- |
| 📊 **Scoring Engine** | Generates a comprehensive Credit Score (300-850), Loan Approval Probability, Default Risk, and a Financial Health Score mapped to 5 risk bands. |
| 🎛️ **What-if Simulator** | Real-time interactive sliders let users modify income, savings, missed payments, CUR, and DTI ratios to immediately see impact on their credit score. |
| 🧠 **Explainable AI (XAI)** | SVG-based SHAP Waterfall diagrams and LIME local tables reveal exactly how individual financial decisions affect the risk profile. |
| 💬 **Expert AI Chatbot** | Interactive conversational assistant answering questions about credit scores, interest rates, and loan terms (Powered by a local rule engine & Gemini AI). |
| 📄 **Enterprise Reports** | Generate and export professional reports in PDF (ReportLab), Excel (openpyxl), and CSV formats. |
| 🛡️ **Admin Console** | Role-switching, live system resource gauges (CPU/Memory), API rate-limiting, and real-time security audit trails. |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **Icons:** Lucide React

### Backend Infrastructure
- **API Framework:** FastAPI, Python
- **Database:** SQLite (local fallback) / PostgreSQL (production), SQLAlchemy
- **Security:** JWT Authentication, Bcrypt password hashing

### Machine Learning Engine
- **Core ML:** Scikit-Learn, XGBoost, LightGBM, CatBoost
- **Explainability:** SHAP, LIME

---

## 💻 Local Quickstart

### Prerequisite Check
Ensure **Python 3.10+** and **Node.js 18+** are installed on your machine.

### 1️⃣ Prepare Machine Learning Models
Navigate to the `ml` folder to generate synthetic data and train the predictive models.
```bash
cd ml
pip install -r requirements.txt
python src/data_prep.py    # Generates synthetic credit dataset
python src/train.py        # Runs AutoML training pipeline & generates joblib models
```

### 2️⃣ Launch FastAPI Backend
Navigate to the `backend` folder to start the API server.
```bash
cd ../backend
pip install -r requirements.txt
python app/main.py
```
> **Note:** The backend boots on `http://localhost:8000`. Swagger API docs are available at `/docs`.

### 3️⃣ Run Next.js Frontend
Navigate to the `frontend` folder to launch the interactive UI.
```bash
cd ../frontend
npm install
npm run dev
```
> **Note:** The frontend client will open on `http://localhost:3000`.

---

## 🐳 Docker Compose Deployment

Want to run everything at once? Deploy the entire stack (FastAPI, Next.js, PostgreSQL, Prometheus, Grafana) via Docker.

```bash
cd docker
docker-compose up --build -d
```

### Port Mappings
* 🌐 **Frontend UI:** `http://localhost:3000`
* 🔌 **FastAPI API:** `http://localhost:8000/docs`
* 📈 **Prometheus Console:** `http://localhost:9090`
* 📊 **Grafana Dashboard:** `http://localhost:3001` *(Default credentials: `admin` / `admin`)*

---

## 📂 Project Structure

```text
credit-card/
├── backend/                  # FastAPI Application (Auth, API Routes, DB)
├── frontend/                 # Next.js Application (UI Components, State)
├── ml/                       # Machine Learning Pipeline (Data prep & Model training)
├── docker/                   # Docker deployment & Grafana/Prometheus Configs
└── package.json              # Root Configuration for Vercel Auto-deployments
```

---

## 🔒 Security Standards

AegisScore is built with enterprise security in mind:
- **JWT Authentication:** User sessions secured with high-entropy HS256 tokens.
- **Password Hashing:** Passwords cryptographically salted and hashed using `bcrypt`.
- **In-Memory Rate Limiting:** Custom IP rate limiter restricts incoming connections (Max 60 hits/min per IP) to mitigate DDoS and brute force risks.
- **Audit Trails:** Core database mutations (logins, predictions, admin operations) trigger immutable audit logs.
- **CORS Policies:** Restricts cross-origin requests exclusively to white-listed client environments.

<br />

<div align="center">
  <i>Built with ❤️ for modern FinTech innovation.</i>
</div>
