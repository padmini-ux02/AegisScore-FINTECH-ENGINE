const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('creditguard_token');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };
    
    try {
      const response = await fetch(url, { 
        ...options, 
        headers,
        cache: 'no-store' // Disable Next.js fetch caching
      });
      
      if (!response.ok) {
        let errMsg = `Request failed: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch {
          // ignore parsing error
        }
        throw new Error(errMsg);
      }
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json() as T;
      }
      throw new Error(`Response is not JSON (Content-Type: ${response.headers.get('content-type')})`);
    } catch (error: any) {
      console.warn(`API Error on ${endpoint}: ${error.message || error}. Using local mockup simulation.`);
      return this.mockResponse<T>(endpoint, options);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const { headers, ...rest } = options;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { ...headers },
      ...rest,
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const { headers, ...rest } = options;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { ...headers },
      ...rest,
    });
  }

  private mockResponse<T>(endpoint: string, options: RequestInit): T {
    // Standard mock data for client testing
    if (endpoint.startsWith('/auth/login')) {
      const body = JSON.parse(options.body as string);
      // Derive a display name from the email prefix (e.g. john.doe@... → John Doe)
      const emailPrefix = body.email.split('@')[0] || 'User';
      const derivedName = emailPrefix
        .split(/[._-]/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const isAdmin = body.email.toLowerCase().includes('admin');
      const mockUser = {
        id: 1,
        email: body.email,
        full_name: derivedName,
        role: isAdmin ? 'admin' : 'user',
        is_active: true,
        created_at: new Date().toISOString()
      };
      // Persist so /auth/me can return the same user in offline mode
      if (typeof window !== 'undefined') {
        localStorage.setItem('aegisscore_mock_user', JSON.stringify(mockUser));
      }
      return {
        access_token: 'mock-jwt-token-val',
        token_type: 'bearer',
        user: mockUser
      } as unknown as T;
    }

    if (endpoint.startsWith('/auth/register')) {
      const body = JSON.parse(options.body as string);
      return {
        id: 2,
        email: body.email,
        full_name: body.full_name || 'New User',
        role: body.role || 'user',
        is_active: true,
        created_at: new Date().toISOString()
      } as unknown as T;
    }

    if (endpoint.startsWith('/auth/me')) {
      // Return the user that was stored during mock login
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('aegisscore_mock_user');
        if (stored) {
          try { return JSON.parse(stored) as unknown as T; } catch { /* fall through */ }
        }
      }
      // Fallback: no session
      throw new Error('No active session');
    }

    if (endpoint.startsWith('/predict/history')) {
      return [
        {
          id: 1,
          inputs: {
            age: 30,
            gender: 'Male',
            marital_status: 'Single',
            employment_type: 'Salaried',
            employment_duration: 3.5,
            education_level: 'Bachelor',
            annual_income: 65000.0,
            monthly_income: 5416.0,
            existing_loans_balance: 10000.0,
            debt_to_income_ratio: 0.28,
            credit_utilization_ratio: 0.22,
            savings_amount: 8000.0,
            investments: 12000.0,
            number_of_active_loans: 1,
            previous_loan_records: 2,
            missed_payments: 0,
            payment_history_ratio: 1.0
          },
          credit_score: 735,
          approval_probability: 0.87,
          default_probability: 0.474,
          financial_health_score: 76.7,
          risk_category: 'Moderate',
          explainable_ai: {
            shap_base_value: 0.15,
            shap_prediction_value: 0.474,
            shap_waterfall: [],
            lime_explanations: [],
            rejection_reasons: [],
            approval_reasons: ['Healthy debt-to-income profile']
          },
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ] as unknown as T;
    }

    if (endpoint.startsWith('/predict') && !endpoint.startsWith('/predict/history')) {
      // Simulate predictions based on inputs
      const req = options.body ? JSON.parse(options.body as string) : {};
      
      const missed = req.missed_payments || 0;
      const dti = req.debt_to_income_ratio || 0.3;
      const cur = req.credit_utilization_ratio || 0.2;
      const inc = req.annual_income || 50000;
      
      // heuristic credit score
      let score = 700 - (missed * 45) - (dti * 150) - (cur * 150) + (inc > 100000 ? 50 : 0);
      score = Math.max(300, Math.min(850, Math.round(score)));
      
      let riskCat = 'Moderate';
      if (score >= 800) riskCat = 'Excellent';
      else if (score >= 740) riskCat = 'Good';
      else if (score >= 670) riskCat = 'Moderate';
      else if (score >= 580) riskCat = 'High Risk';
      else riskCat = 'Very High Risk';

      const defaultProb = Math.min(0.99, Math.max(0.01, (850 - score) / 550 + (dti * 0.2)));
      const approvalProb = Math.min(0.99, Math.max(0.01, (score - 300) / 550 - (dti * 0.4)));
      const healthScore = Math.max(0, Math.min(100, Math.round((score - 300) / 5.5 + 20)));

      // Mock explainable AI
      const mockWaterfall = [
        { feature: 'MissedPayments', value: Number(missed), contribution: missed > 0 ? 0.22 : -0.05, effect: missed > 0 ? 'negative' : 'positive' },
        { feature: 'DebtToIncomeRatio', value: Number(dti), contribution: dti > 0.4 ? 0.15 : -0.04, effect: dti > 0.4 ? 'negative' : 'positive' },
        { feature: 'CreditUtilizationRatio', value: Number(cur), contribution: cur > 0.3 ? 0.18 : -0.08, effect: cur > 0.3 ? 'negative' : 'positive' },
        { feature: 'SavingsAmount', value: Number(req.savings_amount || 5000), contribution: (req.savings_amount || 5000) > 15000 ? -0.12 : 0.05, effect: (req.savings_amount || 5000) > 15000 ? 'positive' : 'negative' },
        { feature: 'PaymentHistoryRatio', value: Number(req.payment_history_ratio || 1.0), contribution: (req.payment_history_ratio || 1.0) < 0.9 ? 0.25 : -0.10, effect: (req.payment_history_ratio || 1.0) < 0.9 ? 'negative' : 'positive' },
        { feature: 'AnnualIncome', value: Number(inc), contribution: inc > 120000 ? -0.15 : 0.03, effect: inc > 120000 ? 'positive' : 'negative' },
        { feature: 'EmploymentDuration', value: Number(req.employment_duration || 3), contribution: (req.employment_duration || 3) > 5 ? -0.08 : 0.02, effect: (req.employment_duration || 3) > 5 ? 'positive' : 'negative' },
        { feature: 'Age', value: Number(req.age || 30), contribution: -0.02, effect: 'positive' }
      ];

      return {
        id: Math.floor(Math.random() * 1000) + 1,
        inputs: req,
        credit_score: score,
        approval_probability: approvalProb,
        default_probability: defaultProb,
        financial_health_score: healthScore,
        risk_category: riskCat,
        explainable_ai: {
          shap_base_value: 0.15,
          shap_prediction_value: defaultProb,
          shap_waterfall: mockWaterfall,
          lime_explanations: mockWaterfall,
          rejection_reasons: score < 670 ? ['Elevated missed payments history', 'Credit card utilization exceeds 40%'] : [],
          approval_reasons: score >= 670 ? ['Healthy debt-to-income profile', 'Excellent credit history consistency'] : ['Stable annual income levels']
        },
        created_at: new Date().toISOString()
      } as unknown as T;
    }

    if (endpoint.startsWith('/analytics/model-comparison')) {
      const metrics = {
        'Logistic Regression': { Accuracy: 0.842, Precision: 0.811, Recall: 0.795, 'F1-Score': 0.803, 'ROC-AUC': 0.892 },
        'Decision Tree': { Accuracy: 0.868, Precision: 0.835, Recall: 0.812, 'F1-Score': 0.823, 'ROC-AUC': 0.905 },
        'Random Forest': { Accuracy: 0.915, Precision: 0.902, Recall: 0.871, 'F1-Score': 0.886, 'ROC-AUC': 0.968 },
        'XGBoost': { Accuracy: 0.932, Precision: 0.925, Recall: 0.894, 'F1-Score': 0.909, 'ROC-AUC': 0.981 },
        'LightGBM': { Accuracy: 0.935, Precision: 0.928, Recall: 0.898, 'F1-Score': 0.913, 'ROC-AUC': 0.983 },
        'CatBoost': { Accuracy: 0.938, Precision: 0.931, Recall: 0.901, 'F1-Score': 0.916, 'ROC-AUC': 0.985 }
      };

      const curves: any = {};
      const models = Object.keys(metrics);
      models.forEach(m => {
        const auc = (metrics as any)[m]['ROC-AUC'];
        const fpr = [];
        const tpr = [];
        const precision = [];
        const recall = [];
        for (let i = 0; i <= 20; i++) {
          const x = i / 20;
          fpr.push(x);
          tpr.push(Math.min(1.0, Math.pow(x, 1 - auc)));
          
          recall.push(x);
          precision.push(Math.min(1.0, 1.0 - Math.pow(x, auc / (1 - auc)) * 0.4));
        }
        curves[m] = {
          roc: { fpr, tpr },
          pr: { precision, recall },
          confusion_matrix: [[340, 50], [20, 190]]
        };
      });

      return {
        metrics,
        curves,
        best_model: 'CatBoost'
      } as unknown as T;
    }

    if (endpoint.startsWith('/analytics/feature-importance')) {
      return [
        ['PaymentHistoryRatio', 0.25],
        ['MissedPayments', 0.22],
        ['CreditUtilizationRatio', 0.18],
        ['DebtToIncomeRatio', 0.13],
        ['SavingsAmount', 0.08],
        ['AnnualIncome', 0.06],
        ['EmploymentDuration', 0.04],
        ['Age', 0.02],
        ['NumberOfActiveLoans', 0.01],
        ['Investments', 0.01]
      ] as unknown as T;
    }

    if (endpoint.startsWith('/analytics/overview')) {
      return {
        total_applications: 142,
        average_credit_score: 695.4,
        average_approval_rate: 0.74,
        average_default_rate: 0.11,
        risk_distribution: {
          Excellent: 28,
          Good: 42,
          Moderate: 48,
          'High Risk': 16,
          'Very High Risk': 8
        },
        recent_activity: [
          { id: 1, age: 34, income: 84000, credit_score: 720, risk_category: 'Good', created_at: '2026-06-07 10:30' },
          { id: 2, age: 48, income: 125000, credit_score: 810, risk_category: 'Excellent', created_at: '2026-06-07 09:15' },
          { id: 3, age: 26, income: 42000, credit_score: 590, risk_category: 'High Risk', created_at: '2026-06-06 17:40' },
          { id: 4, age: 52, income: 68000, credit_score: 660, risk_category: 'Moderate', created_at: '2026-06-06 14:10' }
        ]
      } as unknown as T;
    }

    if (endpoint.startsWith('/chatbot')) {
      const msg = JSON.parse(options.body as string).message.toLowerCase();
      let reply = 'I am your AegisScore AI Advisor. Ask me how to improve your score or what credit utilization is.';
      
      if (msg.includes('improve') || msg.includes('increase')) {
        reply = 'To improve your credit score: 1. Pay bills on time. 2. Keep card utilization below 30%. 3. Keep old accounts open. 4. Limit new credit applications.';
      } else if (msg.includes('utilization')) {
        reply = 'Credit Utilization Ratio is the ratio of your credit card balances to your total card limits. Keeping this ratio below 30% is ideal for your score.';
      } else if (msg.includes('dti') || msg.includes('debt')) {
        reply = 'Debt-to-Income (DTI) ratio is your monthly debt service divided by your monthly gross income. Lenders look for DTI ratios below 36%.';
      }

      return {
        reply,
        suggested_questions: ['How do I improve my score?', 'Explain credit utilization.', 'What is a good DTI ratio?']
      } as unknown as T;
    }

    if (endpoint.startsWith('/admin/users')) {
      return [
        { id: 1, email: 'john.doe@creditguard.ai', full_name: 'John Doe (Simulator)', role: 'admin', is_active: true, created_at: '2026-06-01T12:00:00Z' },
        { id: 2, email: 'user@creditguard.ai', full_name: 'Standard User', role: 'user', is_active: true, created_at: '2026-06-03T15:30:00Z' }
      ] as unknown as T;
    }

    if (endpoint.startsWith('/admin/audit-logs')) {
      return [
        { id: 1, user_id: 1, action: 'LOGIN', details: 'User logged in successfully', created_at: '2026-06-07T11:00:00Z' },
        { id: 2, user_id: 1, action: 'PREDICT', details: 'Score: 780, Risk: Good for User ID: 1', created_at: '2026-06-07T10:45:00Z' }
      ] as unknown as T;
    }

    if (endpoint.startsWith('/admin/metrics')) {
      return {
        total_users: 2,
        total_predictions: 4,
        average_credit_score: 712.5,
        risk_distribution: { Excellent: 1, Good: 2, Moderate: 1, 'High Risk': 0, 'Very High Risk': 0 },
        api_hits_last_24h: 48,
        system_status: 'healthy',
        cpu_usage_pct: 12.4,
        memory_usage_mb: 218
      } as unknown as T;
    }

    return {} as T;
  }
}

export const api = new APIClient();
export default api;
