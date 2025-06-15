from django.urls import path, include
from shared_apps.custom_auth import views
from rest_framework_simplejwt.views import TokenRefreshView
from shared_apps.custom_auth.views import MyTokenObtainPairView

urlpatterns = [
    path('', views.index, name='client_index'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("", include("shared_apps.tenants.urls")),
]