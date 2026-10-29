# FlowTwin AI

### Predictive Digital Workflow Optimization using Graph Analytics and Machine Learning

<p align="left">
  <strong>FlowTwin AI</strong> reconstructs digital user journeys as a directed weighted graph, detects structural bottlenecks and rework loops, and predicts abandonment risk before a workflow ends.
</p>

<p align="left">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React_19_+_Vite_8-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/Backend-FastAPI_0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://networkx.org/"><img src="https://img.shields.io/badge/Graph_Analytics-NetworkX_3.2+-orange?logo=python&logoColor=white" alt="NetworkX" /></a>
  <a href="https://scikit-learn.org/"><img src="https://img.shields.io/badge/ML-Scikit--Learn_1.4+-F7931E?logo=scikit-learn&logoColor=white" alt="Scikit-Learn" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://reactflow.dev/"><img src="https://img.shields.io/badge/Canvas-@xyflow/react-FF0072" alt="React Flow" /></a>
  <a href="https://www.sqlalchemy.org/"><img src="https://img.shields.io/badge/Database-SQLite_/_PostgreSQL-D71F00?logo=sqlite&logoColor=white" alt="Database" /></a>
  <a href="https://github.com/Raghuram1784/FlowTwin-AI/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
</p>

<p align="center">
  <img src="docs/images/overview-dashboard.png" alt="FlowTwin AI overview dashboard" width="100%" />
</p>

---

## 💡 Why FlowTwin AI Exists

Traditional analytics can show completion and abandonment totals, but they often do not explain the actual path users followed, where they backtracked, which steps controlled many journeys, or which active sessions are likely to fail next. When conversion drops, teams are left guessing whether the cause is an unclear form requirement, an upload failure, or repeated navigation loops between distant steps.

FlowTwin AI solves this by modeling the entire workflow as a graph rather than treating each page as an isolated metric. By mapping chronological user event streams into a digital twin, the system quantifies path complexity, measures choke points with graph centrality algorithms, and applies machine learning to evaluate abandonment risk in real time.

| Analytical Dimension | Traditional Analytics | FlowTwin AI Digital Twin |
|---|---|---|
| **Primary Unit of Analysis** | Page view counts & aggregated funnels | Directed state transitions & continuous user paths |
| **Structural Modeling** | Rigid linear steps | Directed weighted graph with cyclical back-loops |
| **Friction Discovery** | Basic funnel drop-off percentages | PageRank, Betweenness centrality, and dwell anomalies |
| **Loop & Rework Analysis** | Typically lost or counted as multiple views | Explicit detection of backward moves & oscillation cycles |
| **Risk Prediction** | Historical retrospective reporting | Real-time session-level risk inference (Random Forest) |
| **Recommendations** | Generic manual audits | Deterministic, analytics-driven actionable interventions |

---

## 🔄 How It Works

FlowTwin transforms raw user interaction events into a queryable graph representation, runs graph algorithms, engineers behavioral features, and powers predictive dashboards:

```mermaid
flowchart LR
    A[User Events] --> B[Session Event Store]
    B --> C[Directed Weighted Graph]
    C --> D[NetworkX Graph Analytics]
    B --> E[Session Feature Engineering]
    E --> F[Random Forest Prediction]
    D --> G[FlowTwin Insights]
    F --> G
    G --> H[Dashboard / Bottlenecks / Sessions / Reports]
```

- **Node**: A discrete workflow step (e.g., `Start`, `Resume Upload`, `Screening Questions`).
- **Edge**: An observed directed transition between two workflow steps (`u -> v`).
- **Edge Weight**: Total observed transition frequency between steps across all recorded sessions.
- **Session**: An ordered, timestamped sequence of steps and dwell times representing an individual user's journey.

---

## 🏛️ System Architecture

FlowTwin is built with a decoupled architecture separating the client-side graph canvas, asynchronous REST API, computational analytics engines, and database persistence:

```mermaid
flowchart TB
    UI[React 19 + Vite Frontend\n@xyflow/react · Recharts · Radix UI] --> API[FastAPI REST API\nPython 3.10+ / Pydantic v2]
    API --> DB[(SQLite / PostgreSQL\nSQLAlchemy ORM)]
    DB --> GRAPH[NetworkX Graph Analytics Engine]
    DB --> ML[Scikit-learn Random Forest Model]
    GRAPH --> API
    ML --> API
    API --> UI

    GRAPH --> GA[PageRank & Centralities\nBetweenness Choke Points\nShortest Path vs Actual Journey\nCycle & Rework Detection]
    ML --> MP[Live Completion vs Abandonment\nCalibrated Risk Probability\n10 Gini Feature Importances\nExplainable Decision Factors]
```

1. **Frontend Presentation**: Built with React 19 and Vite. Features `@xyflow/react` for interactive graph canvas rendering, Recharts for distributions, and Radix UI primitives with Tailwind CSS v4 styling.
2. **Backend Application**: Built with FastAPI. Provides high-throughput asynchronous endpoints for event logging, graph processing, and machine learning inference.
3. **Graph Engine**: Uses NetworkX to build dynamic directed graphs from database events and calculate centralities, shortest paths, and cycles on demand.
4. **Machine Learning Engine**: Scikit-learn Random Forest classifier trained on 10 behavioral journey features to predict completion vs abandonment risk.
5. **Data Persistence**: SQLAlchemy ORM with SQLite for zero-config local execution and native PostgreSQL support for production deployments.

---

## 📋 Event Data Model

Every user interaction is captured as a discrete event linking a session, the origin step, destination step, user action, and dwell time:

```json
{
  "session_id": "sess_job_65d0bfd3",
  "user_id": "usr_78a1bc4e",
  "workflow_id": "job_application",
  "from_step": "job_details",
  "to_step": "apply",
  "action": "navigate",
  "timestamp": "2026-10-28T10:15:42Z",
  "time_spent": 31.2
}
```


---

## 🕸️ Graph Intelligence

NetworkX computes graph metrics dynamically across stored workflow event records:

- **PageRank** — Identifies structurally influential workflow steps across all traversal traffic.
- **Betweenness Centrality** — Finds critical bridge steps that act as bottlenecks and choke points across journey paths.
- **Degree Centrality** — Measures overall connectivity, in-flow navigation, and exit degree of each step.
- **Closeness Centrality** — Measures how centrally positioned and easily reachable a step is within the process flow.
- **Shortest Path** — Compares the theoretical ideal progression against observed real-world journey lengths.
- **Rework / Cycle Analysis** — Detects loops, backward backtracking, and repeated transitions indicative of friction.
- **Drop-off Analysis** — Measures step-level attrition relative to inbound visit volume.

---

## 🤖 Predictive Machine Learning

FlowTwin trains a Scikit-learn **Random Forest Classifier** (`n_estimators=100`, `max_depth=6`) to predict whether an active session will result in **Completion** or **Abandonment** before the user leaves.

```mermaid
flowchart LR
    A[Live Session Events] --> B[10 Behavioral Features Extraction]
    B --> C[Random Forest Classifier\n100 Estimators · Max Depth 6]
    C --> D{Model Output}
    D --> E[Completion Probability %]
    D --> F[Abandonment Probability %]
    D --> G[Risk Classification: Low / Medium / High]
    D --> H[Explainable Decision Factors]
```

### Engineered Behavioral Features
1. `current_step_idx` — Ordinal position index of the applicant's current step.
2. `steps_visited_count` — Cumulative number of steps traversed so far.
3. `total_duration` — Total active seconds accumulated across the session.
4. `avg_time_per_step` — Average dwell time spent per visited step.
5. `backward_movements_count` — Total backward transitions (order decrement).
6. `repeated_steps_count` — Total revisits to already-traversed steps.
7. `repeated_transitions_count` — Redundant traversals along identical step pairs.
8. `errors_count` — File upload or validation error events encountered.
9. `distance_from_completion` — Step distance remaining to terminal success.
10. `bottleneck_reached` — Binary flag indicating traversal of high-friction or high-dwell steps.

### Model Evaluation & Feature Importance
Evaluated on an 80/20 stratified train/test split of stored sessions:
- **Gini Feature Importances**:
  - `current_step_idx`: ~46.9%
  - `distance_from_completion`: ~32.7%
  - `steps_visited_count`: ~8.3%
  - `avg_time_per_step`: ~6.7%
  - `total_duration`: ~3.6%
  - Behavioral anomalies (`repeated_transitions`, `backward_movements`, `errors`): remaining weight.
- **Explainable Decision Drivers**: The model outputs human-readable risk factors (e.g., *"High dwell time on bottleneck step"*, *"Multiple backward navigation cycles detected"*) alongside probabilities.

---

## 🚀 Core Product Features

### Overview Dashboard
High-level operational cockpit displaying live executive KPIs: total sessions, completion rate, abandonment rate, average journey steps, and top friction point. Includes a canonical workflow sequence breadcrumb, completion ratio donut, traffic volume bar chart, and recent high-risk session alerts.

<p align="center">
  <img src="docs/images/overview-dashboard.png" alt="Overview Dashboard" width="100%" />
</p>

### Workflow Digital Twin Graph
Interactive directed canvas powered by `@xyflow/react` and NetworkX.
- Visual node roles: `Start`, `High Traffic`, `Bottleneck`, `Successful Completion`, and `Drop-off Exit`.
- Proportional edge stroke widths representing relative transition volume.
- Interactive slide-over inspection drawer showing PageRank, betweenness centrality, dwell time, and detailed incoming/outgoing transition rates.

<p align="center">
  <img src="docs/images/workflow-graph.png" alt="Workflow Digital Twin Graph" width="100%" />
</p>

### Bottleneck Intelligence & Rule-Based Recommendations
Dynamic friction ranking table sorting steps by drop-off rate, dwell time anomalies, and backtracking counts.
- **Deterministic Actionable Solutions**: Provides rules-based advice based on empirical graph metrics (e.g., auto-parsing recommendation when upload dwell exceeds baseline, or questionnaire simplification when back-loops peak). FlowTwin uses deterministic algorithms for recommendations rather than an external LLM, ensuring zero hallucinations.

<p align="center">
  <img src="docs/images/bottleneck-intelligence.png" alt="Bottleneck Intelligence" width="100%" />
</p>

### ML Predictions & Journey Simulator
- **Live Prediction Workbench**: Interactive sandbox to simulate arbitrary active journeys, inject hesitation loops or errors, and test live risk predictions.
- **Model Evaluation Panel**: Displays accuracy, precision, recall, F1 score, 2x2 confusion matrix, and Gini feature weights, with a one-click retraining button.

### Session Explorer & Event Inspector
Audit table allowing administrators to filter journeys by status (`completed`, `abandoned`, `in_progress`), risk level (`low`, `medium`, `high`), or current step, with search by session/user ID.
- **Chronological Inspector**: Slide-over drawer presenting the exact timestamped sequence of step events, dwell times, and transition actions.

<p align="center">
  <img src="docs/images/session-journeys.png" alt="Session Journeys" width="100%" />
</p>

### Academic & Executive Reports
Publication-ready analytical summary containing:
- NetworkX centrality rankings table (PageRank, Betweenness, Degree, Closeness).
- Path efficiency analysis comparing theoretical shortest paths against actual journey lengths and bloat factors.
- Native print / PDF export support (`window.print()`).

### Interactive Workflow Simulator Sandbox
Realistic user interface simulating the end-to-end Job Application workflow:
- Step-by-step candidate progression: Careers Portal Landing &rarr; Search &rarr; Job Details &rarr; Apply &rarr; Resume Upload (with simulated parsing failures) &rarr; Screening Questions (with hesitation loops) &rarr; Review &rarr; Submit.
- One-click persona presets: *Ideal Candidate*, *Questions Friction*, *Resume Error*, and *Early Drop-off*.

---

## 📊 Current Benchmark Results

The current repository build includes a controlled benchmark dataset representing realistic digital user trajectories:

| Benchmark Metric | Observed Value | Measurement Details |
|---|---|---|
| **Total Recorded Sessions** | **400** | Controlled Job Application benchmark journeys (700 across all workflows) |
| **Completion Rate** | **51.7% – 51.9%** | 207 – 208 successfully completed submissions |
| **Abandonment Rate** | **48.1% – 48.2%** | 193 user drop-offs before completion |
| **Average Journey Length** | **7.5 steps** | Nominal linear path is 8 steps; accounts for early drops and rework |
| **Average Completion Time** | **178.1s – 178.8s** | Active elapsed dwell time across successful paths |
| **Top Observed Bottleneck** | **Resume Upload** | **19.9% – 20.0% drop-off rate**, 30.9s average dwell time |
| **Secondary Bottleneck** | **Job Details** | **17.2% drop-off rate**, 22.8s average dwell time |
| **Tertiary Bottleneck** | **Review Application** | **14.8% drop-off rate**, 27.4s average dwell time |

> **Note on Data Generation**: These figures originate from the current controlled benchmark event dataset. All analytics—including completion rate, PageRank, centrality scores, bottleneck rankings, path comparisons, and ML risk predictions—are calculated dynamically from stored database records on every request and are never hardcoded into the frontend.

---

## 🌐 Workflow-Independent Architecture

FlowTwin AI is a generic analytics engine, not a single-purpose job application tool. Its workflow registry decouples process definitions from data collection and analytics:

```mermaid
flowchart TD
    REG[Workflow Definition Registry\nJSON / Python Schema] --> TOP[Graph Topology & Step Ordering]
    REG --> LBL[Dynamic Step Labels & Roles]
    REG --> FEAT[Behavioral Trajectory Feature Extraction]
    REG --> BOT[Domain-Agnostic Bottleneck & Path Mining]
    
    TOP --> WF1[Job Application\nRecruitment & HR]
    TOP --> WF2[Hospital Appointment\nHealthcare]
    TOP --> WF3[Fintech Loan Application\nFintech & Banking]
```

### Registered Workflows in Repository
1. **Job Application** (*Recruitment & HR*):
   `Start` &rarr; `Search Jobs` &rarr; `Job Details` &rarr; `Apply Initiation` &rarr; `Resume Upload` &rarr; `Screening Questions` &rarr; `Review Application` &rarr; `Submit Application`
2. **Hospital Appointment** (*Healthcare*):
   `Start` &rarr; `Select Department` &rarr; `Choose Doctor` &rarr; `Select Time Slot` &rarr; `Insurance & KYC` &rarr; `Copay Payment` &rarr; `Appointment Confirmed`
3. **Fintech Loan Application** (*Fintech & Banking*):
   `Start` &rarr; `Loan Calculator` &rarr; `Applicant Profile` &rarr; `KYC Identity Check` &rarr; `Income Verification` &rarr; `Automated Underwriting` &rarr; `Loan Disbursed`

Switching the active workflow in the UI dropdown immediately recalculates the digital twin graph, bottleneck scores, and prediction models for that domain.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Libraries / Specifications |
|---|---|---|
| **Frontend** | React 19, Vite 8, JavaScript | `@xyflow/react` (12.11), Recharts (3.10), Radix UI, Lucide React, Framer Motion, React Router DOM (7.18) |
| **Styling** | Tailwind CSS v4, Vanilla CSS | `@tailwindcss/vite` (4.3), PostCSS, CSS Variables |
| **Backend** | Python 3.10+, FastAPI | FastAPI (0.110+), Uvicorn (0.28+), Pydantic v2 (2.6+), Python-Multipart |
| **Graph Analytics** | NetworkX | NetworkX (3.2+) (PageRank, Betweenness, Degree, Closeness, Shortest Path, Communities) |
| **Machine Learning** | Scikit-learn | Scikit-learn (1.4+) (Random Forest Classifier, Stratified Train/Test Split, Confusion Matrix) |
| **Data Processing** | Scientific Python Stack | Pandas (2.2+), NumPy (1.26+), SciPy (1.12+) |
| **Database & ORM** | SQLAlchemy 2.0+ | SQLite (zero-config local default), PostgreSQL compatible |

---

## 🔌 API Overview

The backend exposes a structured REST API grouped by analytical purpose:

- **Workflows**: Retrieve registered digital twin definitions and step hierarchies (`/api/workflows`).
- **Events**: Ingest user transitions, update session state, and recalculate risk (`/api/events`).
- **Sessions**: Query filtered user sessions, inspect full chronological event sequences (`/api/sessions`).
- **Analytics**: Retrieve executive KPIs, full NetworkX graph data, ranked bottlenecks, and paths (`/api/analytics`).
- **Predictions**: On-demand session risk scoring and live arbitrary journey evaluation (`/api/prediction`).
- **Model Management**: Query performance metrics, confusion matrices, and trigger model retraining (`/api/model`).
- **Simulator & Benchmark**: Advance simulation steps, seed multi-workflow datasets, or reset data (`/api/simulator`).

<details>
<summary><strong>View Detailed Endpoint Table</strong></summary>

<br />

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check probe |
| `GET` | `/api/workflows` | List all registered workflow digital twin definitions |
| `GET` | `/api/workflows/{id}` | Retrieve step definitions, labels, and roles for a workflow |
| `POST` | `/api/events` | Ingests an event, updates session, and computes live risk |
| `GET` | `/api/events` | Lists recent events with pagination and session filtering |
| `GET` | `/api/sessions` | Lists sessions with filtering (status, risk, step, search) |
| `GET` | `/api/sessions/{id}` | Returns session details with full chronological event list |
| `GET` | `/api/analytics/summary` | Executive summary KPIs and step statistics |
| `GET` | `/api/analytics/graph` | NetworkX graph nodes, edges, weights, and centralities |
| `GET` | `/api/analytics/bottlenecks` | Ranked bottlenecks with stats and rule-based advice |
| `GET` | `/api/analytics/paths` | Shortest path, top successful journeys, top failed journeys |
| `GET` | `/api/prediction/{id}` | Returns ML prediction and explainability for a session |
| `POST` | `/api/prediction/live` | Live inference on arbitrary active journey states |
| `GET` | `/api/model/metrics` | Model performance metrics, confusion matrix, feature weights |
| `POST` | `/api/model/retrain` | Retrains Random Forest classifier on latest DB sessions |
| `POST` | `/api/simulator/step` | Executes a step transition in an ongoing simulated session |
| `POST` | `/api/simulator/seed` | Seeds database with N realistic sessions and trains ML model |
| `POST` | `/api/simulator/reset` | Resets database and re-seeds clean benchmark records |

</details>

---

## ⚡ Quick Start

Follow these steps to run FlowTwin AI locally on any system.

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Raghuram1784/FlowTwin-AI.git
cd FlowTwin-AI
```

### 2. Backend Setup (FastAPI Python)
Open a new terminal window:

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Note: On first startup, the backend automatically initializes the database, seeds the benchmark multi-workflow dataset, and trains the Random Forest classifier.*

### 3. Frontend Setup (React + Vite)
Open a second terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 3000
```

### 4. Access the Application
- **Web Dashboard**: Open [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **FastAPI Interactive Docs (Swagger)**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Backend Health Check**: Open [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Running Self-Tests
To verify database table creation, graph metrics, and ML training in isolation:
```bash
cd backend
python test_backend.py
```

### Environment Variables
Optional configuration via `backend/.env`:
- `DATABASE_URL`: SQLAlchemy connection string (default: `sqlite:///./flowtwin.db`, or `postgresql://user:pass@localhost:5432/flowtwin`).
- `DEBUG`: Set to `True` for debug mode, `False` for production.
- `CORS_ORIGINS`: Allowed origins list (default: `["*"]`).

---

## 📈 Current Data Status and Roadmap

To maintain engineering transparency, currently implemented capabilities and planned next-phase features are clearly separated:

```
┌───────────────────────────────────────────────┐
│              CURRENT BUILD (LIVE)             │
├───────────────────────────────────────────────┤
│ ✔ Controlled benchmark & synthetic generator  │
│ ✔ Dynamic NetworkX graph analytics            │
│ ✔ Dynamic bottleneck & rework loop ranking    │
│ ✔ 10-feature Random Forest ML risk inference  │
│ ✔ Multi-workflow registration engine          │
│ ✔ Interactive workflow candidate simulator    │
│ ✔ SQLite default & PostgreSQL SQLAlchemy ORM  │
└───────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│             NEXT PHASE (ROADMAP)              │
├───────────────────────────────────────────────┤
│ ◻ CSV batch file upload & schema mapping      │
│ ◻ JSON raw event import wizard                │
│ ◻ Webhook ingestion for live SaaS platforms   │
│ ◻ Append vs Replace dataset mutation modes    │
│ ◻ Session deduplication & anomaly validation  │
│ ◻ Continuous automated model retraining jobs  │
└───────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
FlowTwin-AI/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST API endpoints (analytics, events, ML, sessions, workflows)
│   │   ├── services/            # Graph analytics, ML service, session tracking, workflow registry
│   │   ├── config.py            # Application configuration & environment settings
│   │   ├── database.py          # SQLAlchemy engine & session factory
│   │   ├── main.py              # Application lifecycle, CORS, router mounting
│   │   ├── models.py            # SQLAlchemy database models (SessionModel, EventModel)
│   │   └── schemas.py           # Pydantic validation schemas
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                   # Server startup entry point
│   └── test_backend.py          # Self-contained backend test script
├── frontend/
│   ├── src/
│   │   ├── assets/              # Static branding and icons
│   │   ├── components/          # Reusable UI components (ProcessMapCanvas, Navigation, etc.)
│   │   ├── context/             # React context (WorkflowContext, ThemeContext)
│   │   ├── pages/               # Application views (Overview, Bottlenecks, Graph, Predictions, Sessions, Reports, Simulator)
│   │   ├── services/            # Axios API client & endpoints integration
│   │   ├── App.jsx              # Main application router & layout
│   │   └── index.css            # Tailwind CSS v4 design system
│   ├── package.json             # NPM dependencies & scripts
│   └── vite.config.js           # Vite build configuration
├── docs/
│   └── images/                  # Dashboard and workflow screenshots
│       ├── overview-dashboard.png
│       ├── workflow-graph.png
│       ├── bottleneck-intelligence.png
│       └── session-journeys.png
└── README.md                    # Project documentation
```

---

## 📌 Summary

> FlowTwin AI turns workflow events into a digital twin that reveals where users struggle, why journeys fail, and which sessions are likely to abandon next.

- **GitHub Repository**: [https://github.com/Raghuram1784/FlowTwin-AI](https://github.com/Raghuram1784/FlowTwin-AI)
- **API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Web Application**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
