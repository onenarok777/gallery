FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Pre-download the face model during build (optional but recommended)
# This avoids downloading on first request
RUN python -c "from deepface import DeepFace; import numpy as np; DeepFace.represent(np.zeros((50,50,3), dtype=np.uint8), model_name='Facenet', detector_backend='opencv', enforce_detection=False)" || true

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "1"]
