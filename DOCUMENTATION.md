# Project Documentation

This document provides a comprehensive overview of the project's architecture, components, and functionalities.

## 1. Introduction

This project is a full-stack application template built with Django (backend) and React (frontend). It provides a solid foundation for building secure and scalable web applications, with features like JWT authentication, role-based permissions, and a GraphQL API.

## 2. Backend Documentation

### 2.1. Architecture

The backend is a Django project with a single app, `api`.

-   `api/models`: Contains the database models.
-   `api/graphql`: Contains the GraphQL schema, mutations, and permissions.
-   `app`: Contains the project settings and main URL configuration.

### 2.2. Database Models

-   **`BaseModel`**: An abstract model that provides common fields (`is_active`, `is_deleted`, `created`, `modified`) and implements soft-delete.
-   **`Usuario`**: A custom user model that extends Django's `AbstractUser`. It uses the email as the primary identifier and has a relationship with the `Rol` model.
-   **`Rol`**: Defines user roles (e.g., "Admin", "Editor").
-   **`Item`**: An example model to demonstrate the template's features.

### 2.3. GraphQL API

The API is built using `graphene-django`.

-   **Schema (`api/graphql/schema`)**:
    -   `items.py`: Defines queries for the `Item` model, with pagination and filtering.
    -   `users.py`: Defines queries for the `Usuario` and `Rol` models.
-   **Mutations (`api/graphql/mutations`)**:
    -   `auth.py`: Provides JWT-based authentication (login, token refresh, etc.).
    -   `items.py`: Provides CRUD operations for the `Item` model.

### 2.4. Authentication and Authorization

-   **Authentication**: Implemented using JSON Web Tokens (JWT) via the `graphql_jwt` library. Access tokens are short-lived (15 minutes), and refresh tokens are long-lived (7 days).
-   **Authorization**: A granular, role-based permission system is implemented. The permission checks are in `api/graphql/permissions.py`.
    -   `check_user_role(user, allowed_roles: list)`: A function that checks if a user has one of the roles in the `allowed_roles` list.
    -   `has_role(allowed_roles: list)`: A decorator for protecting mutations and queries.

### 2.5. Error Handling

-   The backend uses `GraphQLError` to return standardized errors to the client.
-   An `ExceptionLoggingMiddleware` catches and logs any unhandled exceptions using Django's logging framework.

## 3. Frontend Documentation

### 3.1. Architecture

The frontend is a React application built with Vite.

-   `src/pages`: Contains the application's pages.
-   `src/components`: Contains reusable components.
-   `src/routes`: Contains the routing configuration.
-   `src/context`: Contains the application's context providers (e.g., `AuthContext`).
-   `src/services`: Contains services for making API calls and other business logic.

### 3.2. Routing

-   The routing is handled by `react-router-dom`.
-   **`PublicRouteConfig.jsx`**: Protects public routes. If a user is logged in, they are redirected to the dashboard.
-   **`PrivateRouteConfig.jsx`**: Protects private routes. It checks for authentication and user roles.

### 3.3. State Management

-   **`AuthContext.jsx`**: Manages the user's authentication state, including the user data and JWTs.

### 3.4. Services

-   **`ApiClient.js`**: An Axios instance with an interceptor that automatically handles token refreshes.
-   **`AuthService.js`**: Handles authentication-related API calls.
-   **`ItemService.js`**: Handles CRUD operations for items.
-   **`NotificationService.js`**: A service for showing notifications using `SweetAlert2`.
-   **`refreshService.js`**: Handles the token refresh logic.

### 3.5. Error Handling and Notifications

-   The application uses `SweetAlert2` to show notifications for success, warning, and error messages.
-   The `NotificationService.js` provides a centralized way to show notifications.

## 4. Getting Started

### 4.1. Prerequisites

-   Python 3.10+
-   Node.js 18+
-   PostgreSQL

### 4.2. Installation

**Backend:**

```bash
# 1. Clone the repository
git clone <repository_url>
cd <repository_name>

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# 3. Install the dependencies
pip install -r requirements.txt

# 4. Set up the environment variables
cp .env.example .env
# Edit the .env file with your database credentials and a secret key

# 5. Run the database migrations
python manage.py migrate
```

**Frontend:**

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install the dependencies
npm install
```

### 4.3. Running the Application

**Backend:**

```bash
python manage.py runserver
```

**Frontend:**

```bash
cd frontend
npm run dev
```

## 5. Best Practices and Recommendations

### 5.1. Security

-   **Environment Variables:** Never commit the `.env` file to version control. Use `.env.example` as a template.
-   **Permissions:** Always use the `check_user_role` function or the `has_role` decorator to protect sensitive operations.
-   **Dependencies:** Regularly update the dependencies to patch any security vulnerabilities.

### 5.2. Code Style

-   **Backend:** Follow the PEP 8 style guide.
-   **Frontend:** Follow the standard React/JavaScript style guides.

## 6. Security Best Practices

This section outlines recommended security enhancements for the project.

### 6.1. Token Storage: `localStorage` vs. `HttpOnly` Cookies

Currently, JWTs are stored in `localStorage`. While convenient, this makes them vulnerable to Cross-Site Scripting (XSS) attacks. A more secure approach is to store the **refresh token** in an **`HttpOnly` cookie**.

-   **HttpOnly Cookies:** These cookies are not accessible via JavaScript, mitigating the risk of token theft through XSS.
-   **Implementation:** This requires backend changes to set the cookie upon login and refresh. The `graphql-jwt` library can be configured to work with cookies. The access token can then be stored in memory on the frontend.

### 6.2. Token Invalidation

The current JWT implementation is stateless. To improve session security, consider implementing a **token denylist**.

-   **How it works:** When a user logs out, their refresh token's ID (`jti`) is added to a denylist (e.g., in Redis). The backend checks this list on every token refresh request, rejecting any denylisted tokens.
-   **Benefit:** This provides a reliable way to invalidate sessions immediately.

### 6.3. Content Security Policy (CSP)

A CSP provides an extra layer of defense against XSS. It's a whitelist of trusted sources from which the browser is allowed to load content.

-   **Recommendation:** Use a library like `django-csp` to configure and enforce a strict CSP.

### 6.4. Rate Limiting

To prevent brute-force attacks on login endpoints and other sensitive operations, it's crucial to implement rate limiting.

-   **Recommendation:** Use a library like `django-ratelimit` to limit the number of requests a user or IP address can make in a given time period.
