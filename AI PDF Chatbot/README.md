# AI PDF Chatbot

A full-stack web application that allows users to upload a PDF document and ask questions about its content using natural language. It uses Retrieval-Augmented Generation (RAG) to ensure the AI's answers are strictly grounded in the uploaded document.

## Tech Stack
- **Frontend**: React (via CDN), HTML/CSS, Vanilla JS, clean ChatGPT-like UI.
- **Backend**: FastAPI (Python), LangChain, PyPDF2, FAISS, OpenAI Embeddings & Chat Models.
- **AI**: OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`).

## Project Structure
- `index.html`: The complete frontend interface (React without build step).
- `backend/`: FastAPI backend directory.
  - `main.py`: API entry point and routes (`/upload`, `/upload-url`, `/ask`).
  - `services/`: Core logic modules.
    - `pdf_extractor.py`: PyPDF2 text extraction.
    - `chunker.py`: Recursive character text splitting.
    - `embeddings.py`: OpenAI embeddings + FAISS in-memory vector store.
    - `retrieval.py`: LangChain RAG pipeline with grounded prompting.

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your OpenAI API Key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and paste your actual OpenAI API key:
     ```
     OPENAI_API_KEY=sk-your-real-api-key
     ```

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run at `http://localhost:8000`.

### 2. Frontend Setup

The frontend is a single `index.html` file that uses React via CDN.

1. Simply open `index.html` in your web browser (e.g., double-click the file or use VS Code Live Server).
2. The UI will automatically connect to the backend running at `http://localhost:8000`.

## Firebase Integration (Optional)

The application supports uploading files directly to the backend. If you want to use Firebase Storage to host the PDFs instead:

1. **Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
   - Enable **Firebase Storage**.
   - Update Storage Rules to allow uploads:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read, write: if true; // (For testing only!)
         }
       }
     }
     ```

2. **Frontend Implementation:**
   - Instead of sending the file via `FormData` to `/upload`, initialize the Firebase JS SDK in `index.html`.
   - Upload the file to Firebase Storage using `uploadBytes`.
   - Get the download URL using `getDownloadURL`.
   - Send the resulting URL to the backend's `/upload-url` endpoint:
     ```javascript
     const res = await fetch("http://localhost:8000/upload-url", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ file_url: downloadURL }),
     });
     ```

3. **Firebase Hosting:**
   - To host the frontend, install Firebase CLI: `npm install -g firebase-tools`
   - Run `firebase init hosting`, select your project, and choose the root directory containing `index.html` as the public directory.
   - Run `firebase deploy`.

## How It Works (RAG Pipeline)
1. **Ingestion (`/upload`)**: When a PDF is uploaded, the backend extracts the text using PyPDF2.
2. **Chunking**: The extracted text is split into smaller, overlapping chunks.
3. **Embedding**: Each chunk is passed to OpenAI's embedding model (`text-embedding-3-small`) to get a vector representation.
4. **Storage**: The vectors are stored in an in-memory FAISS database, mapped to a unique `file_id`.
5. **Retrieval (`/ask`)**: When a user asks a question, the question is embedded, and FAISS performs a similarity search to find the most relevant chunks.
6. **Generation**: The retrieved chunks are injected into a prompt as context, instructing `gpt-4o-mini` to answer the question strictly based on that context.
