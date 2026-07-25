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

## 🏗 Architecture & Storage Rationale

| Datastore | Primary Purpose | Why Selected |
| :--- | :--- | :--- |
| **PostgreSQL (Prisma)** | Transactional Source of Truth | Strongly typed relational model for Orgs, Users, API Keys, Pricing Plans, Subscriptions, and Invoices. Guarantees ACID compliance for monetary balances. |
| **MongoDB (Mongoose)** | High-Volume Telemetry Logs | High write throughput for raw request firehoses. Schema-less flexibility for HTTP headers and payloads without polluting financial databases. |
| **Redis (ioredis)** | Transient In-Memory Cache | Fast sliding-window rate-limiting token buckets, session caches, and queue backpressure state. Never used as a persistent source of truth. |
| **BullMQ** | Async Worker Queues | Decouples gateway request processing from log storage and billing rollups. Prevents database write locks from impacting proxy latency. |

---

## ⚡ Quickstart

### 1. Requirements
- Node.js >= 20
- Docker & Docker Compose

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/hardikkaurani/Meter-Flow.git
cd Meter-Flow

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Spin up Infrastructure (Datastores)
```bash
npm run docker:up
```

### 4. Run Migrations & Start Development
```bash
npm run prisma:migrate --workspace=backend
npm run dev
```

Frontend will run at `http://localhost:5173` and Backend at `http://localhost:5000`.

---

## 📄 License
MIT License. Created by [Hardik Kaurani](mailto:hardikkaurani1@gmail.com).
