# Vaishnavi Crackers - Complete VPS Deployment Guide (Ubuntu / Hostinger / DigitalOcean)

This guide provides complete, step-by-step instructions to deploy the **Vaishnavi Crackers** application (React Vite Frontend + Express Node.js Backend on **Port 5016** + **Local MongoDB Server / Atlas** + Nginx + PM2 + SSL) for your subdomain **`vaishnavi-crackers-shop.gemshine.tech`**.

---

## 🏗️ Architecture Overview

```
                          Internet (User Request)
                                    │
                                    ▼
        [ Nginx Reverse Proxy (Port 80 / 443 HTTPS SSL) ]
              Host: vaishnavi-crackers-shop.gemshine.tech
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
     Frontend (/ & /assets/*)                 Backend API (/api/*)
                │                                       │
                ▼                                       ▼
     Static React SPA Files             Express Node.js Server (Port 5016 via PM2)
     (/var/www/Vaishnavi-Crackers/dist)                 │
                                        ┌───────────────┴───────────────┐
                                        ▼                               ▼
                               MongoDB Database                     Cloudinary
                           (Local or MongoDB Atlas)              (Cloud Storage)
```

---

## 🌐 Step 0: Configure DNS Record in Your Domain Registrar
Before generating the SSL certificate, ensure your DNS A-Record is pointed to your VPS:
- **Type**: `A`
- **Name / Host**: `vaishnavi-crackers-shop` (or full `vaishnavi-crackers-shop.gemshine.tech`)
- **Points to (Value)**: `YOUR_VPS_IP_ADDRESS`
- **TTL**: Auto / 300s

*(DNS changes typically take 2-10 minutes to propagate).*

---

## 💻 Step 1: Connect to VPS & Initial Server Setup

Connect to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Update system repositories:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget gnupg ufw nginx
```

### Install Node.js (v20 LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v # Verify: should output v20.x.x
npm -v  # Verify: should output v10.x.x
```

### Install PM2 (Process Manager):
```bash
sudo npm install -g pm2
```

---

## 🍃 Step 2: Install & Configure MongoDB on VPS (If Using Local DB)

> **Note**: If you are using **MongoDB Atlas Cloud URI**, you can skip this step and proceed to Step 4.

### 1. Import MongoDB Public GPG Key:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
  --dearmor --yes
```

### 2. Add MongoDB Repository:
- **For Ubuntu 24.04 (Noble)**:
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```
- **For Ubuntu 22.04 (Jammy)**:
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```
- **For Ubuntu 20.04 (Focal)**:
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### 3. Install MongoDB:
```bash
sudo apt update
sudo apt install -y mongodb-org
```

### 4. Start and Enable MongoDB on Boot:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```
*(Press `q` to exit status view. It should say **active (running)**).*

---

## 🗄️ Step 3: MongoDB Collections Creation & Verification

The project includes an automatic initialization script (`npm run init:db`) that automatically connects to your database, verifies/creates all required collections, builds indexes, and seeds the initial admin/company accounts!

The collections automatically managed are:
1. `admins` - Admin credentials & auth
2. `customers` - Customer records & profiles
3. `companies` - Company information
4. `products` - Products list & pricing
5. `categories` - Product categories
6. `pricelists` - Price list master data
7. `particulars` - Estimates, Invoices & Orders
8. `accountledgers` - Customer ledger & credit balances
9. `settings` - Store configurations & metadata
10. `inventories` - Stock & inventory records

---

## 🛡️ Step 4: Configure Firewall (UFW)
Secure your VPS by only exposing web ports (80 & 443) and SSH (22). Backend (5016) and Local MongoDB (27017) remain safely internal on `127.0.0.1`.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 📂 Step 5: Clone the Project to `/var/www/Vaishnavi-Crackers`

```bash
sudo mkdir -p /var/www/Vaishnavi-Crackers
sudo chown -R $USER:$USER /var/www/Vaishnavi-Crackers
cd /var/www/Vaishnavi-Crackers

# Clone your repository (or copy your code files):
git clone <YOUR_GIT_REPO_URL> .
```

---

## ⚙️ Step 6: Configure Environment Variables (.env)

### 1. Root `.env` (Frontend build)
```bash
nano .env
```
Paste:
```env
# Frontend API base URL (Nginx proxies /api/ requests to localhost:5016)
VITE_API_URL=/api
```
*(Press `Ctrl + O` -> `Enter` to save, `Ctrl + X` to exit)*

### 2. Backend `server/.env` (Node.js API Server on Port 5016)
```bash
nano server/.env
```
Paste:
```env
# Backend Server Port
PORT=5016

# Environment Mode
NODE_ENV=production

# MongoDB Connection (Local or Atlas URI)
# Option A - Local VPS MongoDB:
# MONGODB_URI=mongodb://127.0.0.1:27017/vaishnavi_crackers_db

# Option B - MongoDB Atlas:
MONGODB_URI=mongodb+srv://heamanthprabhu59_db_user:Heamanth007@cluster0.zo56ev0.mongodb.net/?appName=Cluster0

# Subdomain CORS Whitelist
CORS_ORIGIN=https://vaishnavi-crackers-shop.gemshine.tech,http://vaishnavi-crackers-shop.gemshine.tech,https://vaishnavi-crackers.gemshine.tech,http://localhost:5173,http://localhost:3000,http://localhost:5016

# JWT Secret Key for Admin Authentication
JWT_SECRET=m9cS0NQeO_vKXClkSw2T8XaC03qhzI-kEuLNJZ_UddrwwOBAGGCSsR9g51CMD8nJsRmPS-PFpvqrZcR0hmObEQ

# Default Admin Credentials (auto-seeded on first run)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123

# Cloudinary Storage Configuration (Optional, for PDF/Image uploads)
CLOUDINARY_CLOUD_NAME=daxl7y5um
CLOUDINARY_API_KEY=579937718567788
CLOUDINARY_API_SECRET=e2euCuyOQycviFSHMYhBK-miEKQ
```
*(Press `Ctrl + O` -> `Enter` to save, `Ctrl + X` to exit)*

---

## 🔨 Step 7: Install Dependencies & Build Project

```bash
cd /var/www/Vaishnavi-Crackers

# 1. Install root & frontend dependencies
npm install

# 2. Install backend dependencies
npm --prefix server install

# 3. Build frontend & backend (compiles TypeScript to dist/)
npm run build:all
```

---

## 🚀 Step 8: Initialize Database & Create Collections

Run the automated VPS database initialization command:
```bash
npm run init:db
```
This script will:
- Connect to MongoDB.
- Ensure all 10 collections exist with required indexes.
- Create initial default admin:
  - **Username**: `admin`
  - **Password**: `password123`
- Create initial company ("Vaishnavi Crackers") and settings.

---

## ⚡ Step 9: Start Backend Service with PM2 (Port 5016)

```bash
cd /var/www/Vaishnavi-Crackers
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
*(If `pm2 startup` displays a command on screen, copy and paste it into terminal and run it).*

### Check backend logs to verify connection:
```bash
pm2 status
pm2 logs vaishnavi-crackers-api --lines 25
```
You should see:
```
[Database] MongoDB Connected Successfully!
🚀 Vaishnavi Crackers Server running on port 5016
🔗 Health check: http://localhost:5016/api/health
```

---

## 🌐 Step 10: Configure Nginx Reverse Proxy

Copy the pre-configured Nginx file:
```bash
sudo cp nginx/vaishnavi-crackers-shop.gemshine.tech.conf /etc/nginx/sites-available/vaishnavi-crackers-shop.gemshine.tech
```

Enable the site configuration:
```bash
sudo ln -sf /etc/nginx/sites-available/vaishnavi-crackers-shop.gemshine.tech /etc/nginx/sites-enabled/

# Test Nginx syntax:
sudo nginx -t

# Restart Nginx:
sudo systemctl restart nginx
```

---

## 🔒 Step 11: Install Free SSL Certificate (HTTPS) with Certbot

Ensure your domain `vaishnavi-crackers-shop.gemshine.tech` is pointing to your VPS IP, then run:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vaishnavi-crackers-shop.gemshine.tech
```
- Enter your email address for renewal notices.
- Agree to the Terms of Service.
- Certbot will automatically edit the Nginx configuration to enable HTTPS and configure auto-renewals!

---

## 🧪 Step 12: Verification & Health Check

1. Open your browser and navigate to:
   - **Frontend**: `https://vaishnavi-crackers-shop.gemshine.tech`
   - **Backend Health Check**: `https://vaishnavi-crackers-shop.gemshine.tech/api/health`
2. Expected Backend Response:
   ```json
   {
     "status": "OK",
     "message": "Vaishnavi Crackers API Server is running smoothly",
     "port": 5016,
     "timestamp": "2026-..."
   }
   ```
3. Login to the application with default credentials:
   - **Username**: `admin`
   - **Password**: `password123`

---

## 🔄 Future Updates (1-Step Auto Deploy)

Whenever you push new code to your Git repository, simply run this single command on your VPS:
```bash
cd /var/www/Vaishnavi-Crackers
bash deploy.sh
```
This script automatically pulls changes, builds both frontend and backend, and reloads PM2 with zero downtime!
