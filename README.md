# Personalised Learning Recommendation System

## Overview
The Personalised Learning Recommendation System is an AI-driven educational platform designed to adapt to an individual's learning needs. It tracks a student's progress, provides dynamically generated quizzes, and evaluates topic mastery in real-time. By utilizing advanced AI inference models, the system offers tailored learning paths, tracks historical performance data, and provides an interactive chat assistant to guide students through their educational journey.

## Architecture

### Frontend
The frontend is built to deliver a modern, highly interactive, and responsive user experience. 
- **Framework:** Next.js (React) using the App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Features:** Dynamic dashboard analytics, interactive charts for mastery trends, real-time chat streaming animations, and seamless quiz sessions.

### Backend
The backend serves as a robust API layer handling data persistence and complex AI generation logic.
- **Framework:** Flask (Python)
- **Database:** SQLite (managed via `db.py`)
- **AI Inference:** Integrated with FarAI / Groq API (utilizing models like Qwen/Qwen3-8B) for chat streaming and educational content generation.
- **Features:** Secure endpoints for session management, topic mastery updates, and direct interaction with Large Language Models.

## Project Structure

```text
capstone/
├── frontend/
│   └── frontend/
│       ├── app/            # Next.js App Router (Dashboard, Quiz, Analytics, Settings, etc.)
│       ├── components/     # Reusable UI components (Shadcn, custom cards, charts)
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       ├── public/         # Static assets
│       └── package.json    # Frontend dependencies
├── main/                   # Backend Directory
│   ├── app.py              # Main Flask application entry point
│   ├── db.py               # Database schemas and query logic
│   ├── data.db             # SQLite database file
│   ├── requirements.txt    # Python dependencies
│   ├── static/             # Backend static files
│   └── templates/          # Backend HTML templates (if any)
└── README.md               # Project documentation
```
