# FlowBoard <img src="/frontend/public/logo.png" style="height: 30px">

https://github.com/user-attachments/assets/bd51f5c9-d22b-4207-812f-29e0d95ed803

**Direct Your Video Frame by Frame**

FlowBoard is an AI-powered video storyboard creation tool that transforms your rough sketches and instructions into context-aware video clips. Create storyboards by drawing directly on images, and watch as FlowBoard generates seamless video sequences that extend infinitely.

## Features

- **Interactive Canvas**: Draw instructions directly on your starting images using Tldraw's powerful drawing tools
- **AI Video Generation**: Transform your sketches into video clips using Google Vertex AI
- **Frame-by-Frame Workflow**: Create sequential video frames connected by arrows, building your story step by step
- **Image Enhancement**: Improve frames using AI-powered image enhancement
- **Video Merging**: Combine multiple generated video clips into a single seamless video
- **Custom Frames**: Create aspect-ratio locked frames (16:9) for consistent video output
- **Real-time Preview**: See your video generation progress in real-time

## Usage

1. **Create a Frame**: Start with a default 16:9 frame on the canvas
2. **Draw Instructions**: Use the drawing tools to sketch your video instructions directly on the frame
3. **Add Prompt**: Type a description of what you want in the text box below the frame
4. **Generate Video**: Click the sparkle icon (✨) to generate the next frame
5. **Continue the Story**: Each generated frame becomes the starting point for the next, creating an infinite video sequence
6. **Merge Videos**: Once you have multiple video clips, use the "Merge Videos" button to combine them into one seamless video


## Local Setup

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- Redis (for job queue management)
- Google Cloud Project with Vertex AI enabled
- Supabase project (for authentication and database)

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with the following variables:

```env
# Google Cloud / Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_BUCKET_NAME=your-gcs-bucket-name

# Redis Configuration (for job queue)
REDIS_URL=redis://default:your-password@localhost:6379

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

**Google Cloud Setup**:
- Enable Vertex AI API in your Google Cloud project
- Create a GCS bucket for video storage
- Set up authentication using one of:
  - `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to service account JSON
  - `gcloud auth application-default login` for local development

**Redis Setup**:
- Install Redis locally or use a hosted service (Upstash, Redis Cloud, etc.)
- Update `REDIS_URL` with your connection string

**Supabase Setup**:
- Create a Supabase project at [supabase.com](https://supabase.com)
- Get your project URL and service role key from Project Settings → API
- Create a `users` table with a `credits` column (integer) for credit tracking
- See `backend/scripts/db` for Postgresql functions and schemas
- Enable authentication providers (Google, GitHub, etc.) in Authentication settings

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Create a `.env` file in the `frontend` directory:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8000

# Supabase Configuration (for authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLIC_KEY=your-supabase-anon-public-key
```

**Note**: Use the anon/public key for the frontend (not the service role key)

### 4. Running the Application

#### Start the Backend Server

From the `backend` directory:

```bash
python main.py
```

The backend will run on `http://localhost:8000`

#### Start the Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
# or
yarn dev
```

Open your browser to start using FlowBoard!
