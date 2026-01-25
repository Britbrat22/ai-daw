# ai-daw (Britbrat22)

Frontend: Vite + React + TS  
Backend: FastAPI mastering

## Run backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## Run frontend
cd frontend
npm install
npm run dev

## Deploy (GitHub Pages)
Push to main. Pages URL:
https://britbrat22.github.io/ai-daw/
