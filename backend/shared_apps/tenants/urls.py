# shared_apps/tenants/urls.py
from shared_apps.tenants import views
from django.urls import path, include
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="My API",
      default_version='v1',
      description="API for all endpoints",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("api/", include([
        path("admin/", admin.site.urls),

        path("", include("shared_apps.custom_auth.urls")),

        path("tenants/signup/", views.TenantSignupView.as_view(), name="tenant-signup"),
        path("tenants/send-otp/", views.SendOTPView.as_view(), name="send-otp"),
        path("tenants/verify-otp/", views.VerifyOTPView.as_view(), name="verify-otp"),


        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ])),
]