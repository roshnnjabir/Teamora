from django.shortcuts import render
from django.http import HttpResponse
from shared_apps.custom_auth.serializers import MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
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