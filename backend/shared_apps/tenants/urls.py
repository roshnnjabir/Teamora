# shared_apps/tenants/urls.py
from shared_apps.tenants import views
from django.urls import path, include
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/tenants/signup/', views.TenantSignupView.as_view(), name='tenant-signup'),
]