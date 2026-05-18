FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL y reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY siswisp_backend/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY siswisp_backend/backend/ .

EXPOSE 10000

# Direct Python execution
CMD exec python3 -u run.py
