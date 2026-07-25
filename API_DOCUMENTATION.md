# MeterFlow API Documentation (Phase 2)

Base URL: `http://localhost:5000/api/v1`

---

## Authentication Endpoints

### 1. User Registration & Organization Signup
- **POST** `/auth/signup`
- **Request Body**:
  ```json
  {
    "email": "owner@acme.com",
    "password": "SecurePassword123",
    "name": "Acme Owner",
    "orgName": "Acme Corporation"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_cuid123",
        "email": "owner@acme.com",
        "name": "Acme Owner",
        "role": "owner",
        "orgId": "org_cuid123"
      },
      "organization": {
        "id": "org_cuid123",
        "name": "Acme Corporation"
      },
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "4a7b9c..."
    }
  }
  ```

### 2. User Login
- **POST** `/auth/login`
- **Request Body**:
  ```json
  {
    "email": "owner@acme.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK)**: Returns user info, organization details, access token (15m expiration), and refresh token (7d expiration).

### 3. Refresh Access Token (Single-Use Token Rotation)
- **POST** `/auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "4a7b9c..."
  }
  ```
- **Response (200 OK)**: Returns new `accessToken` and newly rotated `refreshToken`.

---

## API Service Management

### 1. List Organization APIs
- **GET** `/apis`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**: Returns array of APIs owned exclusively by the authenticated user's organization.

### 2. Create API Service
- **POST** `/apis`
- **Headers**: `Authorization: Bearer <access_token>`
- **Request Body**:
  ```json
  {
    "name": "ML Inference Pipeline",
    "description": "Production LLM inference gateway service",
    "upstreamBaseUrl": "https://models.internal.net",
    "environment": "production"
  }
  ```
