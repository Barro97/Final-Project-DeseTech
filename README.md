# Research Dataset Repository Platform

A web-based platform that enables researchers to upload, manage, and share datasets with rich metadata support. Built with Next.js and FastAPI.

## Features

- User authentication and profile management
- Dataset upload with metadata management
- Dataset viewing and downloading
- Personal dataset management dashboard
- Interactive homepage with platform statistics and featured datasets
- File storage and management system

## Tech Stack

### Frontend

- Next.js with TypeScript
- React components
- Tailwind CSS for styling
- App Router for navigation

### Backend

- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- JWT authentication
- Supabase integration

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

1. Create and activate a Python virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Set up the database

- Create a PostgreSQL database for the project
- Run database migrations:

```bash
alembic upgrade head
```

4. Start the backend server

```bash
# On Windows
run_backend.bat

# Alternative
uvicorn main:app --reload
```

### Frontend Setup

1. Install dependencies

```bash
npm install
```

2. Start the development server

```bash
# On Windows
run_frontend.bat

# Alternative
npm run dev
```

## Project Structure

### Backend

```
backend/
├── app/                      # Main application package
│   ├── core/                 # Core modules
│   ├── database/             # Database configuration
│   └── features/             # Feature modules
│       ├── authentication/
│       ├── dataset/
│       ├── file/
│       └── user/
├── migrations/               # Database migrations
└── storage/                  # File storage
```

### Frontend

```
frontend/
├── src/
│   └── app/
│       ├── components/       # Shared UI components
│       ├── features/         # Feature modules
│       │   ├── auth/
│       │   ├── dataset/
│       │   ├── upload/
│       │   └── home/
│       ├── hooks/           # Shared hooks
│       └── lib/             # Utilities
└── public/                  # Static files
```

## Development Guidelines

- Follow the feature-based architecture when adding new functionality
- Ensure proper typing with TypeScript on frontend and Python type hints on backend
- Use the established API response formatting patterns
- Write clear commit messages describing your changes
- Update documentation when making significant changes
