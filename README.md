# JobVox Assistant - Your Personal Interview Prep Companion

JobVox Assistant is a cutting-edge web application designed to help job seekers master their interviewing skills.

## 🚀 Deployment to Google Cloud

This project is configured for automated deployment via GitHub Actions to **Google Cloud Run**.

### 1. GCP Setup
1. **Enable APIs**: Cloud Run, Artifact Registry, and Cloud Build.
2. **Create Artifact Registry**: Create a Docker repository named `jobvox-repo` in `us-central1`.
3. **Service Account**: Create a service account with `Cloud Run Admin`, `Artifact Registry Writer`, and `Service Account User` roles. Generate a JSON key.

### 2. GitHub Secrets
Add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

- `GCP_PROJECT_ID`: Your Google Cloud Project ID.
- `GCP_SA_KEY`: The entire content of your Service Account JSON key.
- `API_KEY`: Your Google Gemini API Key.
- `DB_HOST`: Your PostgreSQL IP (e.g., `136.116.98.130`).
- `DB_NAME`: Database name.
- `DB_USER`: Database username.
- `DB_PASS`: Database password.

### 3. Automatic Deploy
Once secrets are set, simply `git push` to the `main` branch. GitHub Actions will build the containers and deploy them to Cloud Run.

---

## 🛠️ Tech Stack
- **Frontend**: React (v19) + TypeScript + Tailwind
- **Backend**: FastAPI + PostgreSQL
- **AI Engine**: Google Gemini 3 & 2.5 Flash Native Audio
- **Deployment**: Google Cloud Run + GitHub Actions

## 🧰 Local Run with Docker
- Copy `.env.example` to `.env` and set `VITE_GEMINI_API_KEY` (and `VITE_API_BASE=http://localhost:8000` if you change backend port).
- Start stack: `docker compose up --build` (brings up web on 8080, backend on 8000, Postgres with a persisted volume).
- Open http://localhost:8080 for the UI; API is at http://localhost:8000.
- Stop stack: `docker compose down` (volume `db_data` keeps your data). Add `-v` to wipe data if you want a clean slate.

