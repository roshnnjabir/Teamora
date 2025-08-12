FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev gcc netcat-openbsd curl postgresql-client && \
    pip install --upgrade pip && \
    rm -rf /var/lib/apt/lists/*   # keep the image small

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files at build time (for whitenoise)
RUN python manage.py collectstatic --noinput