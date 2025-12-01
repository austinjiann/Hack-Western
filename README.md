# FlowBoard <img src="/frontend/public/logo.png" style="height: 38px; vertical-align: bottom;">

> **Direct Your Video Frame by Frame**

https://github.com/user-attachments/assets/16f3b598-87fc-4f56-af82-0b7a216d3d06

AI-powered video storyboarding that transforms sketches into context-aware video clips. Draw, prompt, generate—infinitely.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **Interactive Canvas** | Draw instructions directly on frames using Tldraw |
| 🤖 **AI Video Generation** | Powered by Google Vertex AI (Veo 3.1 & Gemini 2.5) |
| 🔗 **Frame-by-Frame Workflow** | Sequential frames connected by arrows build your story |
| ⚡ **Image Enhancement** | AI-powered frame improvement on demand |
| 🎬 **Video Merging** | Combine clips into seamless sequences |

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+ & Node.js 18+
- Redis (local or hosted)
- Google Cloud Project (Vertex AI enabled)
- Supabase project

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

**`.env` Configuration:**
```env
# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_BUCKET_NAME=your-gcs-bucket-name

# Redis (job queue)
REDIS_URL=redis://default:password@localhost:6379

# Supabase (auth & database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key
```

**Setup Checklist:**
- ✅ Enable Vertex AI API + create GCS bucket
- ✅ Auth: `GOOGLE_APPLICATION_CREDENTIALS` or `gcloud auth application-default login`
- ✅ Supabase: Create `users` table with `credits` column (see `backend/scripts/db`)
- ✅ Enable auth providers (Google/GitHub) in Supabase dashboard

### Frontend Setup

```bash
cd frontend
npm install
```

**`.env` Configuration:**
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLIC_KEY=your-anon-public-key  # NOT service role key
```

### Run

**Backend:** `python main.py` (→ http://localhost:8000)  
**Frontend:** `npm run dev` (→ http://localhost:5173)

---

## 📖 Usage

1. **Create Frame** → Start with 16:9 frame
2. **Draw/Annotate** → Sketch motion instructions
3. **Add Prompt** → Describe your vision
4. **Generate** → Click ✨ to create next frame
5. **Chain Frames** → Link frames with arrows for sequences
6. **Merge Videos** → Combine clips into final output
