#!/usr/bin/env bash
# Post-create setup for GitHub Codespaces / devcontainer
set -e

echo "==> Installing Node.js dependencies across all workspaces"
npm install

echo "==> Installing Python dependencies for FastAPI service"
pip install --user -r apps/api-python/requirements.txt

echo "==> Installing global tools"
npm install -g turbo supabase

echo "==> Seeding .env from .env.example (if .env does not exist)"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   .env created from template — fill in secrets before running services"
fi

echo ""
echo "==> Setup complete. Useful commands:"
echo "    turbo dev           # Start all services in dev mode"
echo "    turbo build         # Build all workspaces"
echo "    turbo test          # Run all tests"
echo "    turbo lint          # Run linters"
echo "    docker-compose up   # Start containerized stack"
echo ""
