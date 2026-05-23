# 🔐 Authentication

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

A Secure, robust, and production-grade **Authentication API server** built using **Node.js**, **Express**, **TypeScript**, and **Prisma ORM**. Equipped with state-of-the-art security mechanisms, session & device tracking, rate limiting, and background cleanup jobs.

## 🔐 Features

### 👤 Authentication & Authorization
* **Secure Registration & Login** — Password hashing using `bcrypt` and input validations using `zod`.
* **JWT Access & Refresh Tokens** — Access tokens for request authorization and refresh tokens for securing persistent sessions.
* **Refresh Token Rotation (RTR)** — Automatic invalidation of old refresh tokens when a new one is requested.
* **Two-Factor Authentication (2FA)** — Opt-in 2FA secure verification flow with time-bound OTP.
* **OTP & Password Reset System** — Forgot-password flow with secure reset tokens, OTP verification, and EJS template.
* **Resend OTP Throttling** — Anti-spam limits on sending OTP codes.

### 🛡️ Security Features
* **Global & Route-Specific Rate Limiting** — Custom request limits powered by `express-rate-limit` and `rate-limit-redis`.
* **Brute-Force & Spam Prevention** — Prevents credential stuffing attacks by locking/throttling suspicious actions.
* **OTP Request Throttling** — Strictly restricted to a maximum of **5 OTP requests per hour** per user.
* **Suspicious Login Detection** — Inspects user agents to detect and log suspicious device and browser changes.
* **Unhandled Error/Rejection Handlers** — Complete tracking and graceful shutdown procedures to avoid process crashes.

### 📱 Session & Device Management
* **Multi-Device Login Support** — Track and store active user login locations and devices (using User-Agent parsing).
* **Active Session Monitoring** — Retrieve details of all logged-in devices currently accessing the user account.
* **Remote Session Invalidation** — Remotely log out a specific device/session using `sessionId`.
* **Global Logout** — Log out from all devices and invalidate all active sessions simultaneously.

### ⚙️ Backend Engineering
* **Soft Delete Strategy** — User accounts are not deleted immediately. Instead, they are marked as `DELETED`.
* **Automated Cleanup Jobs** — A daily cron scheduler that permanently delete soft-deleted users after **30 days**.
* **Database Rollbacks & Transactions** — Multi-table queries wrapped in transaction logic to ensure data integrity.
* **API Documentation** — Complete OpenAPI 3.0 specs compiled and rendered locally via **Swagger UI**.
* **Automated Code Review** — Seamlessly integrates **CodeRabbit** for AI-powered pull request reviews.

---

## 🚀 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Core JavaScript runtime |
| **Express.js** | Web application framework for routing |
| **TypeScript** | Static typing and enhanced developer workflow |
| **PostgreSQL** | Primary relational database |
| **Redis** | In-memory store for rate limiting and session validation |
| **Prisma** | Modern database toolkit and query builder (ORM) |
| **JSON Web Tokens (JWT)** | Stateless authentication standards |
| **RESEND EMAIL** | Email delivery service |
| **Docker** | Containerized postgres/redis environment orchestration |
| **Swagger UI** | Interactive API browser & documentation generator |

---

## 📂 Project Structure

```
production-auth/
├── openapi/                  # Swagger OpenAPI source definition files
├── prisma/                   # Prisma ORM schemas & migrations
│   ├── schema.prisma         # Primary configuration and generator definition
│   ├── user.prisma           # User data model (soft delete dates, 2FA status)
│   ├── session.prisma        # Active device login tracking model
│   └── enum.prisma           # Reusable schema enums (e.g. UserStatus)
├── src/                      # Source code directory
│   ├── config/               # Environment variable parsing and Redis Client
│   ├── jobs/                 # Cron job function execution logic
│   ├── lib/                  # Singleton initializations (Prisma client)
│   ├── middleware/           # Auth walls, validation runners, rate limiters, error catches
│   ├── modules/              # Main business logic domains
│   │   ├── auth/             # Authentication controller, service, routes, and schemas
│   │   └── settings/         # Account setup, 2FA configurations, preferences
│   ├── schedulers/           # Daily node-cron registry
│   ├── services/             # Helper services (Email SMTP delivery service)
│   ├── templates/            # EJS-based templates for OTP and Password resets
│   ├── types/                # Global and library-specific type definitions
│   ├── utils/                # Helper tools (API error classes, responses, time converters)
│   ├── app.ts                # Express application configuration
│   └── server.ts             # Server boots, DB connects, triggers jobs, binds ports
├── .env.example              # Sample environment variables template
├── package.json              # Dependencies, scripts, and engine engines
├── tsconfig.json             # TypeScript rules configuration
└── swagger.yml               # Compiled single-file OpenAPI configuration
```

---

## 🛠️ Installation & Setup

Follow these simple steps to set up and run the project locally.

### 📋 Prerequisites
Make sure you have the following installed on your machine:
* **Node.js** (v18+ recommended)
* **pnpm** (v10+ package manager)
* **PostgreSQL** & **Redis** servers (running locally or via Docker)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/production-auth.git
cd production-auth
```

---

### Step 2: Install Dependencies
This project uses `pnpm`. If you do not have it installed globally, install it using `npm i -g pnpm`.
```bash
pnpm install
```

---

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory by copying the `.env.example` template:
```bash
cp .env.example .env
```
Open the `.env` file and fill in your local variables:
```env
NODE_ENV=development
PORT=5000

# Primary Database Connection String (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/production_auth?schema=public"

# Redis Server URL
REDIS_URL="redis://localhost:6379"

# JWT Secret Keys
JWT_ACCESS_SECRET="your_access_token_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"
JWT_RESET_SECRET="your_reset_password_secret"
JWT_TWO_FACTOR_SECRET="your_two_factor_auth_secret"

# Email Configuration (Resend Email)
RESEND_API_KEY=re_19zDYwTy_2xJhoHED2DJP2h25Jp6VL9R6
```

---

### Step 4: Run Database Migrations
Initialize PostgreSQL tables and generate the Prisma client based on the schemas:
```bash
# Apply Prisma migrations to the database
pnpm prisma migrate dev

# Generate Prisma Client code
pnpm prisma generate
```

---

### Step 5: Start the Server

#### Development Mode (With Hot Reloading)
```bash
pnpm dev
```
The server will boot and listen at **`http://localhost:5000`**.

#### Regenerate OpenAPI Docs
If you modify Swagger definitions in the `openapi/` folder, bundle them by running:
```bash
pnpm docs
```


## 📡 API Endpoints & Documentation

Once the server is running, visit the interactive **Swagger Documentation** interface:
👉 **`http://localhost:5000/api-docs`**

### 📍 Route Summary

#### 🔓 Public Routes / Core Auth
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login user, issues tokens, tracks session |
| `POST` | `/api/v1/auth/refresh-token` | Rotates & refreshes Access Tokens |
| `POST` | `/api/v1/auth/verify-email` | Verifies user registration OTP |
| `POST` | `/api/v1/auth/forgot-password` | Requests password reset link & OTP |
| `POST` | `/api/v1/auth/verify-forgot-password-otp` | Verifies forgot password OTP |
| `POST` | `/api/v1/auth/reset-password/:resetToken`| Changes password using the reset token |
| `POST` | `/api/v1/auth/verify-two-factor` | Verifies 2FA secure session logins  |
| `POST` | `/api/v1/auth/resend-otp` | Re-sends OTP email (limit 5 / hr) |

#### 🔒 Protected Routes (Require Authentication Header)
Provide your Access Token as a Bearer Token: `Authorization: Bearer <access_token>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | Fetch detailed profile info of logged-in user |
| `GET` | `/api/v1/auth/sessions` | Fetch list of all active sessions & logged-in devices |
| `POST` | `/api/v1/auth/change-password` | Update account password securely |
| `POST` | `/api/v1/auth/logout` | Terminate current device session |
| `DELETE`| `/api/v1/auth/sessions/:sessionId` | Invalidate a specific active session remotely |
| `POST` | `/api/v1/auth/logout-all-devices` | Invalidate all sessions across all devices |
| `DELETE`| `/api/v1/auth/delete-account` | Soft-delete user account (30-day deletion queue) |
| `PATCH` | `/api/v1/settings/toggle-two-factor` | Opt-in or out of Two-Factor Authentication (2FA) |

