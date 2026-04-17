# Multi-stage Dockerfile for FastAPI intelligence service

# --- Builder stage ---
FROM python:3.11-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api-python/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# --- Runner stage ---
FROM python:3.11-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 python \
    && useradd --system --uid 1001 --gid python fastapi

COPY --from=builder /root/.local /home/fastapi/.local
COPY --chown=fastapi:python apps/api-python/ /app/

ENV PATH=/home/fastapi/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

USER fastapi
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD curl --fail http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
