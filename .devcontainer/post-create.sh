#!/usr/bin/env bash
# Post-create setup for GitHub Codespaces / devcontainer
set -e

echo "==> Installing Node.js dependencies across all workspaces"
npm install

echo "==> Installing Python dev tools (linting, testing — NOT runtime deps)"
pip install --user -r apps/api-python/requirements-dev.txt

echo "==> Installing global tools"
npm install -g turbo

echo "==> Seeding .env from .env.example (if .env does not exist)"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   .env created from template — fill in secrets before running services"
fi

echo ""
echo "==> Setup complete! Useful commands:"
echo ""
echo "    # Docker mode (fully containerized):"
echo "    docker compose up -d    # Build + start all 4 containers"
echo "    docker compose ps       # Check container health"
echo "    docker compose logs -f  # Tail all logs"
echo ""
echo "    # Testing + linting:"
echo "    turbo test              # Run all tests"
echo "    turbo lint              # Run ESLint + Ruff"
echo ""
