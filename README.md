# Full-Stack Project Template: Django & React

This is a comprehensive project template for building modern, secure, and scalable full-stack web applications. It uses Django with GraphQL for the backend and React for the frontend.

## Features

-   **Django Backend:** A robust and scalable backend built with the Django framework.
-   **GraphQL API:** A modern and flexible API built with `graphene-django`.
-   **React Frontend:** A fast and responsive frontend built with React and Vite.
-   **JWT Authentication:** Secure authentication using JSON Web Tokens.
-   **Role-Based Permissions:** A granular permission system to control access to different parts of the application.
-   **Automatic Token Refresh:** The frontend automatically handles token refreshes, providing a seamless user experience.
-   **Standardized Error Handling:** Consistent and detailed error messages from the backend.
-   **Code Quality:** The code follows best practices and is compliant with PEP 8 (backend) and standard JavaScript style guides (frontend).

## Prerequisites

-   Python 3.10+
-   Node.js 18+ & npm
-   PostgreSQL
-   tesseract-ocr
-   tesseract-ocr-spa
-   poppler-utils

## Installation

### Backend

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up the environment variables:**
    ```bash
    cp .env.example .env
    ```
    *Edit the `.env` file with your database credentials and a secret key.*

5.  **Run the database migrations:**
    ```bash
    python manage.py migrate
    ```

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

## Running the Application

### Backend

```bash
python manage.py runserver
```
*The backend will be available at `http://localhost:8000`.*

### Frontend

```bash
cd frontend
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

## Documentation

For a more detailed explanation of the project's architecture, components, and functionalities, please see the [**Project Documentation**](DOCUMENTATION.md).

## Contributing

We welcome contributions to this project. Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with a descriptive message.
4.  Push your changes to your fork.
5.  Create a pull request to the main repository.

## Contact

If you have any questions or suggestions, please feel free to open an issue on GitHub.