FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY siswisp_backend/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY siswisp_backend/backend/ .

EXPOSE 10000

# Direct Python execution
CMD exec python3 -u run.py
