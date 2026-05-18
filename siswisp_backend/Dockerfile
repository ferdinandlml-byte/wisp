FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Make startup script executable
RUN chmod +x /app/start.sh

EXPOSE 10000

# Run using simple shell script
ENTRYPOINT ["/bin/sh", "/app/start.sh"]

