#!/bin/bash

# Add the virtual environment's site-packages to Python path
export PYTHONPATH="/home/abu-bakar-siddik/Desktop/symptoseek_backend/SYMPTOSEEK/backend_flask/flask_env/lib/python3.12/site-packages:$PYTHONPATH"

# Run the Flask app
cd /home/abu-bakar-siddik/Desktop/symptoseek_backend/SYMPTOSEEK/backend_flask
python3 app.py
