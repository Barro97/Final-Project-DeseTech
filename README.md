# Research Dataset Repository Platform

A comprehensive web-based platform that enables researchers to upload, manage, and share datasets with rich metadata support. Built with Next.js (frontend) and FastAPI (backend).

## Features

- **User Authentication**: Secure login with JWT tokens and OAuth (Google, GitHub)
- **Dataset Management**: Upload, edit, delete, and organize research datasets
- **File Operations**: Preview CSV/JSON files, download datasets and individual files
- **Search & Discovery**: Advanced search for datasets and researchers
- **Admin Panel**: Content moderation and user management
- **Profile Management**: User profiles with organization affiliation and research interests
- **Collaborative Features**: Dataset ownership sharing and user discovery

## Tech Stack

### Frontend

- **Next.js 15** with TypeScript and App Router
- **React 19** with modern hooks and components
- **Tailwind CSS** for styling with shadcn/ui components
- **React Query** for server state management
- **NextAuth.js** for OAuth authentication

### Backend

- **FastAPI** (Python) with automatic API documentation
- **SQLAlchemy** ORM with PostgreSQL
- **Alembic** for database migrations
- **JWT** authentication with optional OAuth integration
- **Supabase** for file storage

## Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend

# Create virtual environment (Do this only once)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies (Be aware that other developers might add new packages so run this command occasionally)
pip install -r requirements.txt
```

#### Create Backend Environment File

Create `backend/.env` with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/research_dataset_db

# Supabase Configuration (for file storage)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_STORAGE_BUCKET=your_bucket_name

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

#### Run Database Migrations

```bash
# From backend directory
alembic upgrade head
```

#### Start Backend Server

```bash
# From backend directory (with venv activated)
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`
API documentation (for testing the backend) at `http://localhost:8000/docs`

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

#### Create Frontend Environment File

Create `frontend/.env.local` with the following variables:

```env
# Backend API Configuration
NEXT_PUBLIC_BACKEND=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# OAuth Configuration (for Google/GitHub login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

#### Start Frontend Development Server

```bash
# From frontend directory
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Environment Configuration Details

### Backend Environment Variables

| Variable                          | Required | Description                      | Example                                        |
| --------------------------------- | -------- | -------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                    | Yes      | PostgreSQL connection string     | `postgresql://user:pass@localhost:5432/dbname` |
| `SUPABASE_URL`                    | Yes      | Supabase project URL             | `https://your-project.supabase.co`             |
| `SUPABASE_KEY`                    | Yes      | Supabase anon/public key         | `eyJ...`                                       |
| `SUPABASE_STORAGE_BUCKET`         | Yes      | Storage bucket name              | `your-bucket-name`                             |
| `JWT_SECRET_KEY`                  | Yes      | Secret key for JWT token signing | `your_secure_secret_key_here`                  |
| `JWT_ALGORITHM`                   | Optional | JWT signing algorithm            | `HS256` (default)                              |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Optional | Token expiration time in minutes | `1440` (24 hours, default)                     |

### Frontend Environment Variables

| Variable               | Required | Description                    | Example                       |
| ---------------------- | -------- | ------------------------------ | ----------------------------- |
| `NEXT_PUBLIC_BACKEND`  | Yes      | Backend API URL                | `http://localhost:8000`       |
| `NEXT_PUBLIC_API_URL`  | Yes      | API base URL (same as backend) | `http://localhost:8000`       |
| `GOOGLE_CLIENT_ID`     | Optional | Google OAuth client ID         | `123...googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret     | `GOCSPX-...`                  |
| `GITHUB_CLIENT_ID`     | Optional | GitHub OAuth client ID         | `your_github_client_id`       |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth client secret     | `your_github_client_secret`   |
| `NEXTAUTH_URL`         | Optional | NextAuth base URL              | `http://localhost:3000`       |
| `NEXTAUTH_SECRET`      | Optional | NextAuth secret key            | `your_random_secret`          |

## Database Migration to Different Infrastructure

### Connecting to a Different Database

1. **Update Database URL**: Modify the `DATABASE_URL` in `backend/.env`:

   ```env
   # For different PostgreSQL instance
   DATABASE_URL=postgresql://username:password@your-db-host:5432/database_name

   # For cloud databases (example formats)
   DATABASE_URL=postgresql://user:pass@aws-rds-endpoint:5432/dbname
   DATABASE_URL=postgresql://user:pass@azure-postgres-server:5432/dbname
   ```

2. **Ensure Database Exists**: Create the target database if it doesn't exist

3. **Run Migrations**: Apply all migrations to the new database:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Migrating to Cloud Infrastructure

#### Backend Deployment

- **Environment Variables**: Set all required environment variables in your cloud platform
- **Database**: Use managed PostgreSQL services (AWS RDS, Google Cloud SQL, Azure Database)
- **File Storage**: Update Supabase configuration or migrate to other cloud storage
- **CORS**: Update CORS origins in `backend/main.py` for your production domain

#### Frontend Deployment

- **Environment Variables**: Configure production environment variables
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **API URL**: Update `NEXT_PUBLIC_BACKEND` to point to your deployed backend

## Development Commands

### Backend Commands

```bash
# Start development server
uvicorn main:app --reload

## Migrations: not necessary unless the database schema is updated by you!

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Reset database (careful!)
alembic downgrade base
alembic upgrade head
```

### Frontend Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Project Structure

```
project/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration
│   │   ├── database/       # Database setup
│   │   └── features/       # Feature modules
│   │       ├── user/       # User management
│   │       ├── dataset/    # Dataset operations
│   │       ├── file/       # File handling
│   │       └── auth/       # Authentication
│   ├── migrations/         # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # FastAPI app entry
├── frontend/               # Next.js frontend
│   ├── src/app/
│   │   ├── features/      # Feature modules
│   │   ├── components/    # UI components
│   │   └── lib/          # Utilities
│   ├── package.json      # Node dependencies
│   └── next.config.ts    # Next.js config
└── README.md             # This file
```

## Common Issues & Solutions

### Backend Issues

- **Database connection errors**: Verify PostgreSQL is running and credentials are correct
- **Migration errors**: Check if database exists and user has proper permissions
- **Import errors**: Ensure virtual environment is activated and dependencies are installed

### Frontend Issues

- **API connection errors**: Verify backend is running and `NEXT_PUBLIC_BACKEND` is correct
- **OAuth errors**: Check OAuth provider configuration and redirect URLs
- **Build errors**: Clear node_modules and reinstall dependencies

### Database Issues

- **Permission errors**: Ensure database user has CREATE, DROP, and ALTER permissions
- **Connection timeouts**: Check database host accessibility and firewall settings

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request
