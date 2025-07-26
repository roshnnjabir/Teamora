# backend/middleware/jwt_auth_middleware.py

from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from backend.authentication import TenantJWTAuthentication
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        validated_token = UntypedToken(token)
        jwt_auth = TenantJWTAuthentication()
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        user = AnonymousUser()

        # Look for 'cookie' header
        if b"cookie" in headers:
            cookie_header = headers[b"cookie"].decode()
            cookies = dict(item.split("=", 1) for item in cookie_header.split("; ") if "=" in item)

            token = cookies.get("access_token")
            print("TOKEN from cookie:", token)

            if token:
                user = await get_user_from_token(token)
            print("Authenticated user:", user)

        scope["user"] = user
        return await super().__call__(scope, receive, send)
