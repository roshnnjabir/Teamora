from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "A database error occurred. Possibly a duplicate or constraint violation."},
            status=status.HTTP_400_BAD_REQUEST
        )

    return response
