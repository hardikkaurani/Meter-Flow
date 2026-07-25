# MeterFlow — Usage-Based API Billing Platform

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20.x-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue.svg" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-green.svg" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-7.2-red.svg" alt="Redis" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

MeterFlow is a high-throughput, multi-tenant API gateway and usage-based billing platform designed to meter API requests, enforce strict sliding-window rate limits, aggregate raw access telemetry, and generate accurate usage-based invoices.

---

## 🔒 Authentication & Multi-Tenancy Architecture

- **JWT Access Tokens**: Short-lived 15-minute access tokens signed with HMAC SHA-256 containing `userId`, `orgId`, and `role`.
- **Single-Use Refresh Token Rotation**: 7-day refresh tokens stored hashed in PostgreSQL with instant single-use revocation on rotation and password reset.
- **Role-Based Access Control (RBAC)**:
  - `Owner`: Full control including org deletion and member role modification.
  - `Admin`: API, Endpoint, and Key management.
  - `Viewer`: Read-only access to metrics, APIs, and billing.
- **Tenant Isolation**: Every database query is strictly filtered by `orgId` derived from the caller's verified JWT context, preventing cross-tenant data leaks.

---

## ⚡ Quickstart

### 1. Requirements
- Node.js >= 20
- Docker & Docker Compose

### 2. Quick Commands
```bash
# Start Datastores
npm run docker:up

# Migrate Database
npm run prisma:migrate --workspace=backend

# Run Monorepo Development
npm run dev
```

---

## 📄 License
MIT License. Created by [Hardik Kaurani](mailto:hardikkaurani1@gmail.com).
