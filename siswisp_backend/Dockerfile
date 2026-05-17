FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 10000

# Run Flask directly without bash script
CMD ["python", "-c", "import os; os.environ['FLASK_ENV']='production'; from app.main import app; app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)), debug=False, threaded=True)"]

