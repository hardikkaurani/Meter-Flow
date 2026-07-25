# Contributing to MeterFlow

Thank you for your interest in contributing to **MeterFlow**! We welcome contributions from developers of all skill levels.

---

## 🚀 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **Docker & Docker Compose**: For local datastores (PostgreSQL 16, MongoDB 7, Redis 7).
- **Git**

### Step-by-Step Setup
1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Meter-Flow.git
   cd Meter-Flow
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Local Datastores**
   ```bash
   npm run docker:up
   ```

4. **Environment Setup**
   Copy the example environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

5. **Initialize Database Schema**
   ```bash
   npm run prisma:migrate --workspace=backend
   ```

6. **Run Development Servers**
   ```bash
   npm run dev
   ```

---

## 📦 Conventional Commits

We strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks, dependency updates, CI configuration

---

## 🧪 Pull Request Guidelines

1. Create a descriptive feature branch: `git checkout -b feat/rate-limit-redis-sliding-window`
2. Ensure all linting and type checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run format:check
   ```
3. Open a Pull Request adhering to our PR Template.
