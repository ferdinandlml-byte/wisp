FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

EXPOSE 10000

# Use ENTRYPOINT for more reliable startup
ENTRYPOINT ["python3", "-u", "run.py"]

