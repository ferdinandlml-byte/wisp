from flask import Flask, jsonify, request
from flask_cors import CORS
from app.core.database import Base, engine
from app.api.routes.flask_auth import auth_bp
from app.api.routes.flask_clients import clients_bp
from app.api.routes.flask_payments import payments_bp, dashboard_bp
from app.api.routes.flask_plans import plans_bp
from app.api.routes.flask_devices import devices_bp
from sqlalchemy import text
import os

# Crear tablas en BD
Base.metadata.create_all(bind=engine)

# Agregar columnas faltantes en payments (migración manual)
try:
    with engine.connect() as conn:
        # Intentar agregar columnas end_month y end_year si no existen
        conn.execute(text("""
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS end_month INTEGER DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS end_year INTEGER DEFAULT NULL
        """))
        conn.commit()
except Exception as e:
    print(f"[Warning] No se pudo actualizar tabla payments: {e}")

app = Flask(__name__)

# Configurar CORS
CORS(app, supports_credentials=True, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost", "127.0.0.1", "*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["*"],
        "max_age": 86400
    }
})

# Registrar blueprints (rutas)
app.register_blueprint(auth_bp)
app.register_blueprint(clients_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(plans_bp)
app.register_blueprint(devices_bp)


@app.route("/")
def root():
    return jsonify({"app": "SISWISP", "status": "running", "version": "1.0.0"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
