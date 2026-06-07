# AegisScore – Intelligent Credit Scoring & Lending Platform

AegisScore is an enterprise-grade fintech intelligence SaaS platform designed to predict, simulate, and explain customer creditworthiness and loan default risks. The system uses a machine learning ensemble alongside SHAP and LIME explainability models, wrapped in a glassmorphic dashboard built with Next.js and FastAPI.

---

## 🚀 Key Features

*   **Scoring Engine:** Generates Credit Score (300-850), Loan Approval Probability, Default Risk, and a Financial Health Score mapped to 5 risk bands (Excellent, Good, Moderate, High Risk, Very High Risk).
*   **What-if Loan Simulator:** Real-time sliders let users modify income, savings, missed payments, CUR, and DTI ratios to immediately see how their credit score updates.
*   **Explainable AI Dashboard:** SVG-based SHAP Waterfall diagrams and LIME local tables reveal exactly how individual financial decisions affect the risk profile.
*   **Expert AI Chatbot:** Interactive conversational assistant answering questions about credit scores, interest rates, and loan terms. Supports a local rule engine and Google Gemini API backups.
*   **Enterprise Reports:** Generates professional report formats—PDF summaries (via ReportLab), Excel spreadsheets (via openpyxl), and flat CSV rows.
*   **Admin Console:** Admin role-switching, system resource gauges (CPU & Memory), API rate-limiting, and real-time security audit trails.
*   **Production Deployment:** Containerized with Docker Compose, routing metrics into Prometheus and Grafana dashboards.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons.
*   **Backend:** FastAPI, Python, SQLite (local fallback) / PostgreSQL (production), SQLAlchemy.
*   **Machine Learning:** Scikit-Learn, XGBoost, LightGBM, CatBoost, SHAP, LIME.
*   **Infrastructure:** Docker Compose, Prometheus, Grafana.

---

## 📂 Project Structure

```text
credit-card/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── auth/             # JWT, OAuth2 scopes
│   │   ├── core/             # Configuration, security, rate limiters
│   │   ├── db/               # SQLAlchemy models & sessions
│   │   ├── models/           # Pydantic validation schemas
│   │   ├── routers/          # auth, predict, analytics, chatbot, reports, admin
│   │   └── services/         # ML engine, ReportLab PDF layout, local AI Chatbot
│   ├── tests/                # pytest endpoint integrations
│   ├── requirements.txt      # Backend Python dependencies
│   └── Dockerfile            # Multi-stage python image
│
├── frontend/                 # Next.js Application
│   ├── app/                  # Page route mapping, layouts, global CSS
│   ├── components/           # Glassmorphic UI Tab components & widgets
│   ├── lib/                  # Fetch client and mockup fallbacks
│   ├── requirements.json     # Node modules listing
│   └── Dockerfile            # Node build runtime container
│
├── ml/                       # Machine Learning Pipeline
│   ├── data/                 # Data generators & generated CSVs
│   ├── models/               # Joblib serialized models, scalers, JSON curves
│   └── src/                  # data_prep.py & train.py scripts
│
├── docker/                   # Docker deployment configurations
│   ├── docker-compose.yml    # Coordinates PostgreSQL, FastAPI, Next.js, Prometheus, Grafana
│   └── prometheus.yml        # Metrics scraping config
└── README.md
```

---

## 💻 Local Quickstart

### Prerequisite Check
Ensure Python 3.10+ and Node.js 18+ are installed.

### Step 1: Clone and Prepare ML Models
1. Navigate to the `ml` folder and install dependencies:
   ```bash
   cd ml
   pip install -r requirements.txt
   ```
2. Generate synthetic credit dataset:
   ```bash
   python src/data_prep.py
   ```
3. Run AutoML training pipeline to generate the joblib models and JSON benchmarks:
   ```bash
   python src/train.py
   ```

### Step 2: Launch FastAPI Backend
1. Navigate to `backend` folder and install dependencies:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```
2. Run backend server:
   ```bash
   python app/main.py
   ```
   *The backend will boot on `http://localhost:8000`. Swagger API docs can be viewed at `/docs`.*
3. Validate backend endpoints by executing tests:
   ```bash
   pytest tests/
   ```

### Step 3: Run Next.js Frontend
1. Navigate to `frontend` folder and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
2. Launch development client:
   ```bash
   npm run dev
   ```
   *The frontend client will open on `http://localhost:3000`.*

---

## 🐳 Docker Compose Deployment

To build and run all services (FastAPI, Next.js, PostgreSQL, Prometheus, Grafana) in Docker:
1. Navigate to the `docker` directory:
   ```bash
   cd docker
   ```
2. Start the stack:
   ```bash
   docker-compose up --build -d
   ```
3. Port mappings:
   *   **Frontend UI:** `http://localhost:3000`
   *   **FastAPI API:** `http://localhost:8000/docs`
   *   **Prometheus Console:** `http://localhost:9090`
   *   **Grafana Dashboard:** `http://localhost:3001` (Default credentials: `admin` / `admin`)

---

## 🔐 Security Standards

1.  **JWT Authentication:** User sessions are secured with high-entropy HS256 tokens.
2.  **Password Hashing:** Passwords are cryptographically salted and hashed using `bcrypt` (via passlib).
3.  **In-Memory Rate Limiting:** A custom IP rate limiter restricts incoming connections to a maximum of 60 hits/minute per IP, mitigating DDoS and brute force risks.
4.  **Audit Trials:** Core database mutations (logins, registrations, predictions, admin operations) trigger immutable `AuditLog` logs containing description and user references.
5.  **CORS & Host Scopes:** Restricts cross-origin requests exclusively to white-listed client environments (e.g. Next.js on port 3000).
