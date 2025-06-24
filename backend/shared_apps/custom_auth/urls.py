from django.urls import path, include
from shared_apps.custom_auth import views
from shared_apps.custom_auth.views import MyTokenObtainPairView, MyTokenRefreshView, LogoutView, MeView

urlpatterns = [
    path('', views.index, name='client_index'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name="logout"),
    path('api/me/', MeView.as_view(), name='me'),
]