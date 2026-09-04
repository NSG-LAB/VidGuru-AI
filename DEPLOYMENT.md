# 🚀 VidGuru AI — Production Deployment Guide

This guide covers deploying VidGuru AI using **GitHub Actions CI/CD**, **GitHub Container Registry (GHCR)**, and **Docker Compose**.

---

## 🏗️ Deployment Architecture

```
                                  Git Push to `main`
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │     GitHub Actions CI/CD Pipeline     │
                      │  - Python 3.11 Backend Tests (7/7)    │
                      │  - Node 20 Frontend Standalone Build  │
                      │  - Multi-stage Docker Builds (QEMU)   │
                      └───────────────────┬───────────────────┘
                                          │ Push Images
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    GitHub Container Registry (GHCR)   │
                      │  - ghcr.io/nsg-lab/vidguru-backend    │
                      │  - ghcr.io/nsg-lab/vidguru-frontend   │
                      └───────────────────┬───────────────────┘
                                          │ Pull Images
                                          ▼
                      ┌───────────────────────────────────────┐
                      │       Production Server (VPS/Cloud)   │
                      │  - docker-compose.prod.yml            │
                      │  - Persistent Volume (./backend/data) │
                      │  - Optional: Nginx + Let's Encrypt    │
                      └───────────────────────────────────────┘
```

---

## 1. 🔑 GitHub Repository Secrets Configuration

In your GitHub repository (**Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**), add the following:

### Repository Secrets (`Secrets`)
| Secret Name | Required | Description |
|---|:---:|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for pedagogical lesson planning & Socratic evaluation |
| `OPENAI_API_KEY` | Optional | Fallback OpenAI API key (if using GPT-4o-mini) |
| `GROQ_API_KEY` | Optional | Fallback Groq API key |

> [!NOTE]
> `GITHUB_TOKEN` is provided automatically by GitHub Actions with `packages: write` permissions to publish images to GHCR. No manual setup required for container registry authentication.

### Repository Variables (`Variables`, Optional)
| Variable Name | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8005/api/v1` | Public API endpoint accessible by the student's browser |

---

## 2. 🐳 Server Setup & Deployment (One-Command)

On your production server (Ubuntu/Debian VPS, AWS EC2, DigitalOcean Droplet, Hetzner, etc.):

### Step 1: Install Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in to apply group changes
```

### Step 2: Clone the Deployment Configuration
```bash
git clone https://github.com/NSG-LAB/VidGuru-AI.git
cd VidGuru-AI
```

### Step 3: Configure `.env`
Create a production `.env` file:
```bash
cat << 'EOF' > .env
# VidGuru AI Production Environment
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# Ports on the host
BACKEND_PORT=8005
FRONTEND_PORT=3001

# Public URL for the browser client to reach the FastAPI backend
NEXT_PUBLIC_API_BASE=http://your-server-ip:8005/api/v1
EOF
```

### Step 4: Pull and Run with Docker Compose
```bash
# Pull latest GHCR images published by GitHub Actions
docker compose -f docker-compose.prod.yml pull

# Start services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Verify services are running and healthy
docker compose -f docker-compose.prod.yml ps
```

---

## 3. 🌐 Nginx Reverse Proxy & Free SSL (Certbot)

To run VidGuru AI under a custom domain (e.g., `vidguru.yourdomain.com`) with automatic HTTPS:

### Nginx Virtual Host Configuration (`/etc/nginx/sites-available/vidguru`)
```nginx
server {
    server_name vidguru.yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API & TTS Audio Streams
    location /api/ {
        proxy_pass http://127.0.0.1:8005/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site and Activate SSL:
```bash
sudo ln -s /etc/nginx/sites-available/vidguru /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Install free Let's Encrypt SSL certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vidguru.yourdomain.com
```

---

## 4. 🔄 Automated Continuous Deployment (CD)

To automatically pull the latest image and restart containers when GitHub Actions finishes publishing, you can use:

### Option A: Watchtower (Automatic Container Updates)
Add Watchtower to your server to poll GHCR and automatically update running containers when a new image is pushed:
```bash
docker run -d \
  --name watchtower \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  vidguru-backend-prod vidguru-frontend-prod
```

### Option B: GitHub Actions SSH Deploy Step
Add an SSH deployment job to `.github/workflows/ci-cd.yml` using `appleboy/ssh-action` with your server's SSH key.

---

## 5. 🔍 Health Checks & Maintenance

```bash
# Check service logs in real time
docker compose -f docker-compose.prod.yml logs -f

# Verify API health
curl http://localhost:8005/api/v1/health

# Back up uploaded documents and lesson plans
tar -czvf vidguru_backup_$(date +%F).tar.gz ./backend/data
```
