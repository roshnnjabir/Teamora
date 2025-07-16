# core/validators.py

from rest_framework.serializers import ValidationError

def validate_future_date(value):
    if value <= timezone.now().date():
        raise ValidationError("Date must be in the future.")