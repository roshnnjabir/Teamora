from django.urls import path
from shared_apps.custom_auth.views import (
    MyTokenObtainPairView, MyTokenRefreshView,
    LogoutView, MeView, index
)
from django.conf import settings
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="My API",
      default_version='v1',
      description="API for all endpoints. \n\n"
            "➡️ Use `/token/` to log in.\n"
            "➡️ In production, JWTs are stored in HttpOnly cookies.\n"
            "➡️ For Swagger testing, paste your token above as: `Bearer <access_token>`."
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('', index, name='client_index'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
]

if settings.DEBUG:
    urlpatterns += [
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]
