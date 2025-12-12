# Vulnerability Analyzer - Installation Guide

This guide describes how to install and run the Vulnerability Analyzer using Docker. This is the recommended method for Linux environments.

## Prerequisites

- Connect to your server via SSH.
- Ensure you have `sudo` privileges.

### Option 1: Automated Docker Setup (Ubuntu/Debian)
We have provided a helper script to install Docker automatically.

```bash
chmod +x scripts/setup_docker.sh
sudo ./scripts/setup_docker.sh
```

### Option 2: Manual Installation
- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation

1. **Clone the Repository** (or copy the project files to your server):
   ```bash
   git clone <repository_url> vuln_analyzer
   cd vuln_analyzer
   ```

2. **Configure Environment (Optional)**:
   - Provide a secure secret for authentication in `docker-compose.yml`:
     ```yaml
     environment:
       - NEXTAUTH_SECRET=your_secure_random_string
     ```

3. **Start the Application**:
   Run the following command to build and start the container in the background:
   ```bash
   sudo docker compose up -d --build
   ```

4. **Verify Deployment**:
   - Check status: `sudo docker compose ps`
   - View logs: `sudo docker compose logs -f`

## Initial Setup

1. Open your browser and navigate to `http://localhost:3000` (or your server's IP).
2. You will be redirected to the **Initial Setup** page.
3. Create your Administrator account.
4. Once completed, you will be efficiently managing your assets!

## Data Persistence

All database data is stored in the `./data` directory created in your project folder. Ensure this directory is backed up regularly.

## Updating

To update the application to the latest version:

```bash
# Pull latest code
git pull

# Rebuild and restart container
docker-compose up -d --build
```
