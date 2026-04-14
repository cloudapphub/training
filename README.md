# 🎓 Cloud Training Hub

A comprehensive, hands-on training portal built with **React 19**, **Vite**, and **Tailwind CSS 4**. Covering 16+ courses across cloud infrastructure, full-stack development, AI/ML, and security — with interactive lessons, real code snippets, and practice exercises.

## 📚 Available Courses

| Course | Lessons | Duration |
|--------|---------|----------|
| Python Fundamentals | 9 | 8 hrs |
| Prompt Engineering | 10 | 9 hrs |
| Terraform for AWS | 9 | 8 hrs |
| Terraform HCL Deep Dive | 9 | 8 hrs |
| Migration to AWS EKS | 9 | 8 hrs |
| Spring Boot on EKS + Aurora | 9 | 8 hrs |
| AWS EKS Managed Nodes | 10 | 10 hrs |
| Generative AI & LLM Concepts | 9 | 8 hrs |
| LangGraph Agents | 10 | 10 hrs |
| Agentic Commerce | 10 | 10 hrs |
| HSM & SWIFT Payments | 10 | 10 hrs |
| React 19 | 10 | 10 hrs |
| Core Java 21+ | 15 | 15 hrs |
| Angular 17+ | 12 | 12 hrs |
| Keycloak & Spring Boot | 10 | 10 hrs |
| Spring Boot 3 Mastery | 12 | 12 hrs |

## 🛠️ Tech Stack

- **Frontend:** React 19, React Router 7, Lucide Icons
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite 8
- **Container:** Node 22 (build) → Nginx Alpine (serve)

---

## 🚀 Deployment Guide

### Prerequisites

| Requirement | Version | Install Guide |
|------------|---------|---------------|
| **Docker** | 20.10+ | See below by OS |
| **Docker Compose** | v2+ (bundled with Docker Desktop) | Included with Docker Desktop |
| **Git** | Any | [git-scm.com](https://git-scm.com) |

---

### 🐧 Linux (Ubuntu / Debian)

#### 1. Install Docker

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose-plugin

# Add your user to the docker group (avoids sudo)
sudo usermod -aG docker $USER

# Apply group change (or log out & back in)
newgrp docker

# Verify
docker --version
docker compose version
```

#### 2. Clone & Deploy

```bash
git clone <your-repo-url> training
cd training

# Build and start (detached)
docker compose up -d --build

# Verify it's running
docker ps
```

#### 3. Access

Open **http://localhost:3000** in your browser.

#### 4. Stop

```bash
docker compose down
```

---

### 🍎 macOS

#### 1. Install Docker Desktop

```bash
# Option A: Download from docker.com
# https://www.docker.com/products/docker-desktop/

# Option B: Install via Homebrew
brew install --cask docker
```

Launch **Docker Desktop** from Applications and wait for the Docker engine to start (whale icon in menu bar turns solid).

#### 2. Clone & Deploy

```bash
git clone <your-repo-url> training
cd training

# Build and start (detached)
docker compose up -d --build

# Verify it's running
docker ps
```

#### 3. Access

Open **http://localhost:3000** in your browser.

#### 4. Stop

```bash
docker compose down
```

---

### 🪟 Windows

#### 1. Install Docker Desktop

1. Download **Docker Desktop** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Run the installer — enable **WSL 2 backend** when prompted
3. Restart your computer if prompted
4. Launch **Docker Desktop** and wait for the engine to start (green indicator in system tray)

> **WSL 2 Note:** If prompted, install the WSL 2 Linux kernel update from [aka.ms/wsl2kernel](https://aka.ms/wsl2kernel)

#### 2. Clone & Deploy (PowerShell)

```powershell
git clone <your-repo-url> training
cd training

# Build and start (detached)
docker compose up -d --build

# Verify it's running
docker ps
```

#### 3. Access

Open **http://localhost:3000** in your browser.

#### 4. Stop

```powershell
docker compose down
```

---

## 🔧 Common Docker Commands

```bash
# Rebuild after code changes
docker compose up -d --build

# View logs
docker compose logs -f training

# Restart the container
docker compose restart training

# Full cleanup (remove container + image)
docker compose down --rmi all

# Check container resource usage
docker stats training-portal
```

---

## 💻 Local Development (Without Docker)

If you prefer to run locally without Docker:

### Prerequisites

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **npm 10+** (bundled with Node)

### Steps

```bash
# Clone the repo
git clone <your-repo-url> training
cd training

# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
```

The dev server starts at **http://localhost:5173** with hot module replacement.

### Production Build (Local)

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture

```
training/
├── Dockerfile              # Multi-stage: Node 22 build → Nginx serve
├── docker-compose.yml      # Single-service orchestration on port 3000
├── package.json            # React 19 + Vite 8 + Tailwind 4
├── vite.config.js          # Vite + React + Tailwind plugins
├── index.html              # SPA entry point
├── src/
│   ├── App.jsx             # React Router routes
│   ├── TrainingHome.jsx    # Course catalog (home page)
│   ├── *Training.jsx       # Training page components (per course)
│   └── *Lessons.js         # Lesson data (concepts, code, exercises)
└── README.md
```

### How It Works

1. **Dockerfile** runs a two-stage build:
   - **Stage 1 (build):** `node:22-alpine` installs deps, runs `vite build`, produces static files in `/app/dist`
   - **Stage 2 (serve):** `nginx:alpine` copies the built files and serves them with SPA fallback routing
2. **docker-compose.yml** maps container port `80` to host port `3000`
3. Nginx is configured with `try_files $uri $uri/ /index.html` for client-side routing

---

## ❓ Troubleshooting

| Issue | Fix |
|-------|-----|
| **Port 3000 already in use** | Change the port in `docker-compose.yml`: `"8080:80"` |
| **Docker daemon not running** | Start Docker Desktop (macOS/Windows) or `sudo systemctl start docker` (Linux) |
| **Permission denied on Linux** | Run `sudo usermod -aG docker $USER` then log out/in |
| **Build fails on ARM Mac (M1/M2/M3)** | Docker Desktop handles multi-arch automatically; ensure it's updated |
| **Changes not reflected** | Rebuild: `docker compose up -d --build` |
| **WSL 2 not installed (Windows)** | Run `wsl --install` in PowerShell as Admin, then restart |

---

## 📝 License

Internal training material. Not for public distribution.
