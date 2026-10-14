# 🏥 Health Risk Intelligence Platform (v2.0 Enhanced)

An end-to-end, clinical-grade diabetes risk intelligence system demonstrating the complete machine learning product stack:
* **Multi-Algorithm Tournament:** Benchmarking Logistic Regression, Random Forest, XGBoost, and LightGBM / HistGradientBoosting with stratified cross-validation and probability calibration.
* **Explainable AI (XAI):** Real-time local biomarker attributions via SHAP game theory.
* **Interactive Counterfactual "What-If" Simulator:** Live sliders for glucose, BMI, and blood pressure to visualize achievable risk reduction before prescribing interventions.
* **Personalized Clinical Action Plans:** Evidence-based diet, activity, and follow-up guidance mapped to individual patient risk drivers (ADA guidelines).
* **Enterprise Security & Longitudinal History:** JWT authentication with bcrypt, patient risk trajectory over time, and 1-click CSV EHR exports.
* **Project Technical Documentary:** Full end-to-end engineering and mathematical specification in [`PROJECT_DOCUMENTARY.md`](PROJECT_DOCUMENTARY.md).

---

## 🚀 Key Feature Showcase

| Feature | Description | Primary Endpoints |
|---|---|---|
| **Clinical Assessment Intake** | Evaluates 8 biomarkers, predicts calibrated probability & population percentile | `POST /predict` |
| **What-If Risk Simulator** | Interactive counterfactual sliders comparing baseline vs target health metrics | `POST /predict/simulate` |
| **Personalized Recommendations** | Prioritized interventions mapped to top biomarker SHAP drivers | `POST /predict/recommendations` |
| **User Authentication & Profiles** | JWT Bearer authentication with bcrypt hashing & role presets | `POST /auth/login`, `POST /auth/register` |
| **Model Registry & Analytics** | Multi-algorithm benchmark comparison table & population risk stats | `GET /admin/models`, `GET /admin/system-stats` |
| **Trajectory & CSV Export** | Historical assessment log with downloadable CSV dataset | `GET /history/{user_id}`, `/history/{user_id}/export/csv` |
| **Interactive In-App Docs** | Built-in interactive technical documentary & architecture diagrams | UI Tab: Technical Docs |

---

## 🏆 Model Tournament Benchmark

| Architecture | Test AUPRC (Primary) | Test AUROC | Brier Score (Loss) | Test F1 | Test Accuracy | Specificity | Sensitivity (Recall) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression (Winner)** 🏆 | **0.7181** | **0.8402** | **0.1642** | **0.7333** | **79.2%** | **78.0%** | **81.5%** |
| **Random Forest (300 Trees)** | 0.7019 | 0.8252 | 0.1630 | 0.6780 | 75.3% | 76.0% | 74.1% |
| **XGBoost (Depth 4)** | 0.6966 | 0.8207 | 0.1740 | 0.6727 | 76.6% | 81.0% | 68.5% |
| **LightGBM (HistGradientBoosting)** | 0.6407 | 0.8204 | 0.1722 | 0.6724 | 75.3% | 77.0% | 72.2% |
| **Calibrated Logistic Regression** | 0.7171 | 0.8410 | 0.1609 | 0.5941 | 73.4% | 83.0% | 55.6% |

---

## 💻 Running the Platform Locally

### Quick Run Without Docker

#### Terminal 1 — Backend API
```powershell
cd "c:\Users\Subrata Paul\Desktop\health-risk-platform"
.\venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --reload --port 8000
```
- **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### Terminal 2 — React Dashboard
```powershell
cd "c:\Users\Subrata Paul\Desktop\health-risk-platform"
cd frontend
npm run dev
```
- **Web Application Dashboard:** [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

```powershell
cd "c:\Users\Subrata Paul\Desktop\health-risk-platform\backend"
..\venv\Scripts\pytest.exe
```
*(All 9 automated tests verify prediction, what-if simulation, recommendations, authentication, admin metrics, and CSV exports).*

---

## 🚀 How to Run the Platform

### Option A: One-Click Launcher (Recommended)
Double-click or run from command prompt:
```cmd
.\start_project.bat
```

### Option B: Manual Multi-Terminal Execution

#### Terminal 1 (Backend API & ML Service):
```powershell
cd "C:\Users\Subrata Paul\Desktop\health-risk-platform"
.\venv\Scripts\Activate.ps1
cd ml
python train.py
cd ..\backend
uvicorn app.main:app --reload
```

#### Terminal 2 (React Frontend Dashboard):
```powershell
cd "C:\Users\Subrata Paul\Desktop\health-risk-platform"
cd frontend
npm run dev
```

---

## 📚 Technical Documentation & Methodology

* [**Comprehensive Project Documentary**](PROJECT_DOCUMENTARY.md): Full end-to-end mathematical, medical, and architectural writeup.
* [**Side-by-Side Comparative Audit Report**](SIDE_BY_SIDE_PROJECT_REPORT.md): Direct side-by-side audit of baseline vs enhanced system.
* [**Official Publication PDF Report**](HEALTH_RISK_PLATFORM_DOCUMENTARY_REPORT.pdf): Executive summary and multi-algorithm tournament matrix.
* [**Architecture Deep Dive**](docs/ARCHITECTURE.md): Microservice lifecycle, database schema, and request flow.
* [**Methodology**](docs/METHODOLOGY.md): Data preparation, physiological sanity checks, and evaluation protocols.
* [**Experiments & Comparisons**](docs/EXPERIMENTS.md): Empirical cross-validation analysis and calibration curves.
* [**Model Card**](docs/MODEL_CARD.md): Clinical intended use, demographics, and safety limitations.
