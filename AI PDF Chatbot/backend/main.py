from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import os

app = FastAPI()

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Storage
# =========================
UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

pdf_store = {}

# =========================
# Models
# =========================
class QuestionRequest(BaseModel):
    file_id: str
    question: str

# =========================
# Routes
# =========================
@app.get("/")
def home():
    return {
        "message": "Askora AI Backend Running"
    }

# =========================
# Upload PDF
# =========================
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Check PDF
        if file.content_type != "application/pdf":
            return {
                "detail": "Only PDF files allowed"
            }

        # Generate ID
        file_id = str(uuid.uuid4())

        # Save file
        file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.pdf")

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        # Store info
        pdf_store[file_id] = {
            "filename": file.filename,
            "path": file_path,
            "size": len(contents),
        }

        # Fake word count
        word_count = len(contents.split())

        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "word_count": word_count,
        }

    except Exception as e:
        return {
            "success": False,
            "detail": str(e)
        }

# =========================
# Ask Question
# =========================
@app.post("/ask")
async def ask_question(req: QuestionRequest):
    try:
        # Check file exists
        if req.file_id not in pdf_store:
            return {
                "detail": "Invalid file ID"
            }


        # Fake AI response
        answer = f"You asked: '{req.question}' about '{pdf_store[req.file_id]['filename']}'"

        return {
            "success": True,
            "answer": answer
        }

    except Exception as e:
        return {
            "success": False,
            "detail": str(e)
        }