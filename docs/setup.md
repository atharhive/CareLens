# Setup Guide

This guide provides instructions for setting up the CareLens development environment.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.8+)
- [Redis](https://redis.io/)
- [Git](https://git-scm.com/)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/atharhive/CareLens.git
    cd CareLens
    ```

2.  **Set up the backend:**

    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    ```

3.  **Set up the frontend:**

    ```bash
    cd frontend
    npm install
    cd ..
    ```

4.  **Configure environment variables:**

    In the `backend` directory, copy `.env.example` to `.env` and update the values as needed.

    ```bash
    cp backend/.env.example backend/.env
    ```

    In the `frontend` directory, copy `.env.example` to `.env.local` and update the values as needed.

    ```bash
    cp frontend/.env.example frontend/.env.local
    ```

## Running the Application

1.  **Start Redis:**

    ```bash
    redis-server
    ```

2.  **Start the backend server:**

    ```bash
    cd backend
    uvicorn app.main:app --reload --port 8000
    ```

3.  **Start the frontend server:**

    ```bash
    cd frontend
    npm run dev
    ```

**Access Points:**

-   **Frontend:** [http://localhost:3000](http://localhost:3000)
-   **Backend API:** [http://localhost:8000](http://localhost:8000)
-   **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
