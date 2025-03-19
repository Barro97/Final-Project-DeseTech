# Full Stack Project with Next.js and FastAPI

This project consists of a Next.js frontend and a FastAPI backend. Below are the instructions to get both parts of the project up and running on Windows.

## Prerequisites

Before you begin, ensure you have the following installed on your Windows system:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- [pip](https://pip.pypa.io/en/stable/installation/) (Python package installer)
- [npm](https://www.npmjs.com/) (Node.js package manager)

## Project Structure

```
project/
├── frontend/         # Next.js frontend
└── backend/         # FastAPI backend
```

## Backend Setup (FastAPI)

1. Open Command Prompt and navigate to the backend directory:

   cd backend

2. Create a Python virtual environment:

   python -m venv venv

3. Activate the virtual environment:

   .\venv\Scripts\activate

4. Install the required dependencies:

   pip install -r requirements.txt

5. Start the FastAPI server:
   uvicorn main:app --reload

The backend server will be running at `http://localhost:8000`

You can access:

- API documentation at `http://localhost:8000/docs`
- Alternative API documentation at `http://localhost:8000/redoc`

## Frontend Setup (Next.js)

1. Open a new Command Prompt window and navigate to the frontend directory:

   cd frontend

2. Install the required dependencies:

   npm install

3. Start the development server:

   npm run dev

The frontend application will be running at `http://localhost:3000`

## Testing the Connection

1. Make sure both servers are running:
   - Backend server in one Command Prompt window (port 8000)
   - Frontend server in another Command Prompt window (port 3000)
2. Visit `http://localhost:3000` in your browser
3. Click the "Test Backend Connection" button
4. You should see a success message if everything is working correctly

## Common Issues and Solutions

1. **Backend server not starting**

   - Make sure you're in the correct directory in Command Prompt
   - Verify that the virtual environment is activated (you should see `(venv)` at the start of your command line)
   - Run `pip list` to verify that all dependencies are installed
   - Check if port 8000 is free by running: `netstat -ano | findstr :8000`
   - If port is in use, you can kill the process using: `taskkill /PID <PID> /F`

2. **Frontend server not starting**

   - Make sure you're in the correct directory in Command Prompt
   - Try deleting the `node_modules` folder and running `npm install` again
   - Check if port 3000 is free by running: `netstat -ano | findstr :3000`
   - If port is in use, you can kill the process using: `taskkill /PID <PID> /F`

3. **Connection test failing**
   - Ensure both Command Prompt windows show their respective servers are running
   - Check the browser console (F12) for any CORS-related errors
   - Verify that the backend URL in the frontend code matches the running backend server

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
