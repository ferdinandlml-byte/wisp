FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN chmod +x entrypoint.sh

EXPOSE 10000

CMD ["./entrypoint.sh"]
