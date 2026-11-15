# Dependency Time Machine

### Intelligent Dependency Risk Analysis & Vulnerability Monitoring Platform

Dependency Time Machine is a full-stack application designed to help developers understand dependency upgrade risks, identify known security vulnerabilities, and make informed package management decisions.

## Features

- **Dependency Detection:** Identifies packages and versions from uploaded dependency files.
- **Version Analysis:** Checks installed versions against available latest versions.
- **Upgrade Risk Analysis:** Categorizes dependency upgrade risks into High, Medium, Low and Unknown.
- **Vulnerability Detection:** Identifies known vulnerabilities using the OSV vulnerability database.
- **Smart Recommendations:** Provides prioritized dependency upgrade recommendations.
- **AI-Powered Explanations:** Generates understandable explanations of dependency risks and recommended actions.
- **Interactive Dashboard:** Displays dependency statistics, risk information and security findings.

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Axios

### Backend
- Python
- FastAPI
- Uvicorn
- Requests

### Security & Intelligence
- OSV Vulnerability Database
- OpenRouter API

## Project Structure

```text
Dependency Time Machine/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd "Dependency Time Machine"
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv
```

Activate the environment on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your OpenRouter API key in the backend environment file using the variable name expected by `ai_explainer.py`.

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Supported Dependency File Formats

- `.txt`
- `.json`
- `.toml`
- `.lock`
- `.mod`

## Disclaimer

Vulnerability findings are based on available vulnerability database information. Upgrade risk classifications represent estimated compatibility risks and should not be interpreted as confirmed security vulnerabilities.

Always review official advisories, release notes and package compatibility before upgrading dependencies.

## Author

Developed as a full-stack software engineering project.