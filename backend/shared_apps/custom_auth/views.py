from django.shortcuts import render
from django.http import HttpResponse
from shared_apps.custom_auth.serializers import MyTokenObtainPairSerializer, UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.conf import settings
from shared_apps.custom_auth.models import User

def index(request):
    tenant = request.tenant
    print(tenant)
    
    users = tenant.users.all()
    print(users)

    user_list = "".join(f"<li>{user.email} ({user.role})</li>" for user in users)
    return HttpResponse(f"<h1>{tenant.name} Users</h1><ul>{user_list}</ul>")


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        host = request.get_host().split(':')[0]
        subdomain = host.split('.')[0] if '.' in host else None
        
        

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")

            # Set access token cookie (httpOnly, secure)
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                max_age=15 * 60,  # 15 minutes
            )

            # Set refresh token cookie
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                max_age=7 * 24 * 60 * 60,  # 7 days
            )

            # remove tokens from response body
            response.data.pop("access", None)
            response.data.pop("refresh", None)
            response.data = {"detail": "Login successful"}

        return response


class MyTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response({"detail": "Refresh token not found."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            token = RefreshToken(refresh_token)
            new_access_token = str(token.access_token)

            # Optionally rotate refresh token here with token.blacklist() if you use blacklist app

            response = Response({"access": new_access_token}, status=status.HTTP_200_OK)
            # Set new access token in HttpOnly cookie
            response.set_cookie(
                key="access_token",
                value=new_access_token,
                httponly=True,
                secure=True,  # Set True in production (HTTPS)
                samesite='Lax',
                max_age=15*60,  # 15 minutes or your access token lifetime
            )
            return response

        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "email": user.email,
            "role": getattr(user, "role", None),
            "is_tenant_admin": getattr(user, "is_tenant_admin", False),
            "name": user.get_full_name() or user.email,
        }
        serializer = UserSerializer(instance=data)
        return Response(serializer.data, status=status.HTTP_200_OK)