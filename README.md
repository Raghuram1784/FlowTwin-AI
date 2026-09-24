# FlowTwin AI: Predictive Digital Workflow Optimization

[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![NetworkX](https://img.shields.io/badge/Graph_Analytics-NetworkX-orange.svg)](https://networkx.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E.svg)](https://scikit-learn.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC.svg)](https://tailwindcss.com/)

**FlowTwin AI** is an advanced full-stack analytics platform that models user navigation through digital workflows as a **directed weighted graph (Digital Twin)**. It applies **NetworkX graph algorithms** (PageRank, Betweenness Centrality, Degree Centrality, Closeness Centrality, Community Detection, Shortest Path) and **Scikit-Learn Random Forest Machine Learning** to detect friction points, rank bottlenecks, and predict in real-time whether an active applicant is likely to complete or abandon the workflow.

---

## 🏗️ System Architecture

```
                                  FLOWTWIN AI ARCHITECTURE
                                  
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           React.js Frontend (Vite)                          │
  │  - React Flow Workflow Digital Twin Canvas                                  │
  │  - Interactive Simulator (Job Application Workflow)                         │
  │  - Executive Overview & KPI Cards                                           │
  │  - Bottleneck Intelligence & Rule-Based Recommendation Engine               │
  │  - Scikit-Learn Model Performance & Live Prediction Panel                   │
  │  - Session Explorer & Chronological Event Inspector Drawer                  │
  │  - Academic GWA Analytical Report (Print/Export Ready)                      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │  REST API Calls (/api)
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         FastAPI Python Backend                              │
  │  ├── /events                ──> Session tracking & event ingestion           │
  │  ├── /sessions              ──> Filtered session explorer queries            │
  │  ├── /analytics/summary     ──> Executive KPI metrics & step stats          │
  │  ├── /analytics/graph       ──> NetworkX Directed Graph analytics            │
  │  ├── /analytics/bottlenecks ──> Algorithmic bottleneck ranking engine        │
  │  ├── /analytics/paths       ──> Shortest paths & journey pattern mining     │
  │  ├── /prediction/live       ──> Real-time Random Forest risk inference      │
  │  ├── /model/metrics         ──> Accuracy, Confusion Matrix, Gini Importance  │
  │  └── /simulator/step        ──> Step simulator & Synthetic data generator   │
  └───────────────────────┬───────────────────────────────┬─────────────────────┘
                          │                               │
                          ▼                               ▼
       ┌─────────────────────────────────────┐  ┌────────────────────────────────┐
       │     NetworkX Graph Analytics        │  │   Scikit-Learn Random Forest   │
       │  • PageRank & Centralities          │  │ • 10 Engineered Features       │
       │  • Dwell Times & Drop-off Rates     │  │ • Completion (1) vs Exit (0)   │
       │  • Shortest Path vs Actual Journey  │  │ • Explainable Risk Factors     │
       │  • Loop & Cycle Detection           │  │ • Confusion Matrix & Metrics   │
       └──────────────────┬──────────────────┘  └───────────────┬────────────────┘
                          │                                     │
                          └──────────────────┬──────────────────┘
                                             ▼
                             ┌───────────────────────────────┐
                             │    SQLite / PostgreSQL DB     │
                             │  • Sessions Table (Statuses)  │
                             │  • Events Table (Transitions) │
                             └───────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, `@xyflow/react` (React Flow), Recharts, Lucide React, Framer Motion |
| **Backend** | Python 3.14+, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2 |
| **Graph Analytics** | NetworkX 3.6+ (PageRank, Centralities, Shortest Path, Community Detection) |
| **Machine Learning** | Scikit-Learn (Random Forest Classifier, Train/Test Split, Confusion Matrix, Feature Importance) |
| **Data Processing** | Pandas, NumPy, SciPy |
| **Database** | SQLite (Default for zero-config local run) / PostgreSQL supported |

---

## 🚀 Quick Start Instructions

Both servers can be started in separate terminal windows.

### Terminal 1: Backend (FastAPI Python)

```powershell
# 1. Navigate to the backend directory
cd "c:\Users\Raghu Ram\Desktop\4-1 Sem\GWA\FlowTwin AI\backend"

# 2. Start the FastAPI server (starts on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Note: On first startup, the backend automatically initializes the database, generates 500 realistic synthetic sessions, and trains the Scikit-Learn Random Forest model.*

### Terminal 2: Frontend (React + Vite)

```powershell
# 1. Navigate to the frontend directory
cd "c:\Users\Raghu Ram\Desktop\4-1 Sem\GWA\FlowTwin AI\frontend"

# 2. Start the Vite dev server (starts on http://127.0.0.1:3000)
npm run dev -- --host 127.0.0.1 --port 3000
```

### Accessing the Application

- **Web Dashboard**: Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.
- **FastAPI Interactive Docs**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 📊 Features & Navigation Pages

### 1. Overview Dashboard
- **Executive KPIs**: Total Sessions, Completion Rate, Abandonment Rate, Average Journey Steps, Highest Bottleneck Step, High-Risk Sessions Count.
- **Interactive Workflow Sequence Preview**: Visual breadcrumb strip (`Start` → `Search` → `Details` → `Apply` → `Resume` → `Questions` → `Review` → `Submit`) showing visits and drop-offs.
- **Visual Analytics**:
  - Donut chart of Completed vs Abandoned vs In-Progress sessions.
  - Bar chart of workflow traffic volume per step.
  - Top 3 ranked bottlenecks with severity badges.
  - Shortest theoretical path vs observed journey comparison.
  - Step dwell time progress indicators.
  - Recent high-risk sessions table.

### 2. Workflow Digital Twin Graph (`@xyflow/react` + NetworkX)
- Interactive canvas rendering the directed weighted digital twin graph.
- Visual node roles: Normal, High Traffic, Bottleneck, High Abandonment, Successful Completion (Goal), and Drop-off Exit.
- Dynamic edge stroke width representing transition frequency and percentages.
- **Node Inspection Sheet**: Clicking any node opens a slide-over sheet showing:
  - Total visits, Entry count, Exit count, Drop-off %.
  - Average dwell time.
  - **NetworkX Metrics**: PageRank, Betweenness Centrality (choke point), Degree Centrality, Closeness Centrality.
  - Incoming and Outgoing transition lists with volume counts.

### 3. Bottleneck Intelligence Page
- Algorithmic ranking of workflow friction points (e.g. Screening Questions, Resume Upload, Review).
- Detailed breakdown per bottleneck: Users Entering, Users Continuing, Users Abandoning, and Repeated Navigation Loops.
- Continuance vs Drop-off visualization bars.
- **Deterministic Actionable Recommendations**: Rule-based advice based on empirical dwell time and rework loops (e.g. suggesting resume auto-parsing or streamlining screening questionnaires).
- Related failed journey paths.

### 4. Machine Learning Predictions Page
- **Live Prediction Workbench**: Interactive journey simulator testing active sessions.
  - Displays Completion Probability %, Abandonment Probability %, and Risk badge (`High`, `Medium`, `Low`).
  - **Explainability**: Clear decision drivers explaining why the risk is elevated (e.g., backward movements, file errors, bottleneck step reached, abnormal dwell time).
  - Test buttons to simulate rework loops, errors, or preset candidate personas.
- **Model Evaluation Panel**:
  - Evaluated on 80/20 train/test split.
  - Accuracy, Precision, Recall, F1 Score.
  - 2x2 Binary Confusion Matrix (TP, TN, FP, FN).
  - Feature Importances bar chart (Gini Importance across 10 behavioral dimensions).
  - One-click model retraining button.

### 5. Session Explorer Page
- Administrative session inspector table.
- Filter by: Status (`completed`, `abandoned`, `in_progress`), Risk level (`high`, `medium`, `low`), Workflow Step, or Search by Session/User ID.
- Pagination controls.
- **Chronological Event Inspector Sheet**: Inspects any session's exact sequence of timestamped events, dwell times, and transition actions.

### 6. Reports Page (GWA Academic Synthesis)
- Executive summary report formatted for academic submission and stakeholder presentations.
- **NetworkX Centrality Rankings Table**: PageRank, Betweenness, Degree, Closeness.
- **Path Efficiency Analysis**: Shortest theoretical path (8 steps) vs actual journey length comparison and bloat factor.
- Print / PDF export button (`window.print()`).

### 7. Realistic Workflow Simulator Page
- Realistic candidate interface for the demo job application workflow:
  1. **Start**: Careers portal landing.
  2. **Search**: Search & filter open roles.
  3. **Job Details**: Compensation, team, requirements.
  4. **Apply Initiation**: Contact details.
  5. **Resume Upload**: File upload simulator with options to test valid upload or trigger parsing errors.
  6. **Screening Questions**: Role questions with hesitation loop button to navigate back to Resume.
  7. **Review**: Application summary.
  8. **Submit**: Goal achieved confirmation.
- Includes **Exit Workflow** and **Back** buttons on every step.
- Live sidebar displaying the real-time DB event stream and live ML risk updates.
- One-click persona simulator buttons:
  - *Ideal Candidate* (Smooth complete)
  - *Questions Friction* (Loops and exits)
  - *Resume Upload Error* (Parsing failure)
  - *Early Search Drop-off*

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/events` | Ingests an event, updates session, and computes live risk |
| `GET` | `/api/events` | Lists recent events with pagination |
| `GET` | `/api/sessions` | Lists sessions with filtering (status, risk, step, search) |
| `GET` | `/api/sessions/{id}` | Returns detailed session with full chronological event list |
| `GET` | `/api/analytics/summary` | Executive summary KPIs and step statistics |
| `GET` | `/api/analytics/graph` | NetworkX graph nodes, edges, weights, and centralities |
| `GET` | `/api/analytics/bottlenecks` | Ranked bottlenecks with stats and rule-based advice |
| `GET` | `/api/analytics/paths` | Shortest path, top successful journeys, top failed journeys |
| `GET` | `/api/prediction/{id}` | Returns ML prediction and explainability for a session |
| `POST` | `/api/prediction/live` | Live inference on arbitrary active journey states |
| `GET` | `/api/model/metrics` | Model performance metrics, confusion matrix, feature weights |
| `POST` | `/api/model/retrain` | Retrains Random Forest classifier on latest DB sessions |
| `POST` | `/api/simulator/step` | Executes a step in an ongoing simulated session |
| `POST` | `/api/simulator/seed` | Seeds database with N realistic sessions and trains ML model |
| `POST` | `/api/simulator/reset` | Resets database and re-seeds clean synthetic records |

---

## 🧠 Synthetic Data Generator Details

The generator in `app/services/data_generator.py` produces realistic non-random behavioral distributions across 7 personas:
1. **Successful Direct (32%)**: Linear progression, realistic dwell times (12–35s), zero errors.
2. **Successful Exploratory (14%)**: Backtracks between Search and Details, completes application.
3. **Early Drop-off at Search (10%)**: Exits after quick glance.
4. **Early Drop-off at Details (10%)**: Reads job requirements and exits.
5. **Resume Bottleneck (14%)**: Encounters file format friction, high dwell time, abandons.
6. **Questions Friction (14%)**: Loops back to resume to check info, high dwell time, abandons.
7. **Late Review Abandoner (6%)**: Drops at final review step.

---

## 🧪 Running Self-Tests

To run the backend verification script:
```powershell
cd "c:\Users\Raghu Ram\Desktop\4-1 Sem\GWA\FlowTwin AI\backend"
python test_backend.py
```
Outputs confirmation of table creation, synthetic data generation, NetworkX graph metrics, bottleneck detection, and Scikit-Learn training.
