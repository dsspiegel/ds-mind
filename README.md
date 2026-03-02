# Your DS Agent

Your DS Agent is a web-based, multi-language (Python and SQL) data science notebook environment with a unique, AI-powered knowledge persistence system called 'Minds'.

## Key Features

*   **Interactive Notebook:** Execute Python and SQL code in a familiar notebook-style interface.
*   **AI-Powered Knowledge:** Automatically distill insights and knowledge from your work into a persistent 'Mind'.
*   **Modern Tech Stack:** Built with a robust backend using FastAPI and a responsive frontend using Next.js.

## Tech Stack

*   **Backend:** Python, FastAPI, Google Cloud Firestore, Google Generative AI
*   **Frontend:** TypeScript, Next.js, React

## Getting Started

### Prerequisites

*   Python 3.9+
*   Node.js and npm
*   Access to Google Cloud Platform services (Firestore, Generative AI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd your-ds-agent
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Configuration:**
    Create a `.env` file in the root of the project and add your `GOOGLE_API_KEY`:
    ```
    GOOGLE_API_KEY=your_google_api_key
    ```

### Running the application

1.  **Start the backend:**
    ```bash
    cd backend
    uvicorn main:app --reload
    ```

2.  **Start the frontend:**
    ```bash
    cd frontend
    npm run dev
    ```
