FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
  libpq-dev gcc netcat-openbsd curl && \
  pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Create non-root user
RUN adduser --disabled-password teamorauser

# 👇 FIX: give ownership of the entire app directory to the user
RUN chown -R teamorauser:teamorauser /app

# Switch to non-root user
USER teamorauser