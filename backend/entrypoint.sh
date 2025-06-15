#!/bin/bash

echo "Waiting for PostgreSQL to start..."
until pg_isready -h db -p 5432; do
  sleep 1
done

echo "PostgreSQL started"

python manage.py migrate_schemas --shared

exec "$@"