# FlowBoard 

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

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tldraw 4.2** - Interactive whiteboard/canvas
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Sonner** - Toast notifications

### Backend
- **Python 3** with BlackSheep (async web framework)
- **Google Vertex AI** - Video generation (Veo 3.1)
- **Google Cloud Storage** - File storage
- **Redis** - Job queue and caching
- **Uvicorn** - ASGI server

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- Google Cloud account with:
  - Vertex AI API enabled
  - Cloud Storage bucket created
  - Service account with appropriate permissions
- Redis server (for job queue)

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with the following variables:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
```

**Note**: Make sure you have Google Cloud credentials configured. You can either:
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account JSON file
- Use `gcloud auth application-default login` for local development

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

Create a `.env` file in the `frontend` directory 

```env
VITE_BACKEND_URL=http://localhost:8000
```

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

## Usage

1. **Create a Frame**: Start with a default 16:9 frame on the canvas
2. **Draw Instructions**: Use the drawing tools to sketch your video instructions directly on the frame
3. **Add Prompt**: Type a description of what you want in the text box below the frame
4. **Generate Video**: Click the sparkle icon (✨) to generate the next frame
5. **Continue the Story**: Each generated frame becomes the starting point for the next, creating an infinite video sequence
6. **Merge Videos**: Once you have multiple video clips, use the "Merge Videos" button to combine them into one seamless video

