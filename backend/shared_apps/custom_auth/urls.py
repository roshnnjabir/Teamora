from django.urls import path
from shared_apps.custom_auth.views import (
    MyTokenObtainPairView, MyTokenRefreshView,
    LogoutView, MeView, index
)

urlpatterns = [
    path('', index, name='client_index'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
]