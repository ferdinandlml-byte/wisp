#!/bin/bash
export FLASK_APP=app.main:app
export FLASK_ENV=production
exec python -m flask run --host=0.0.0.0 --port=$PORT

