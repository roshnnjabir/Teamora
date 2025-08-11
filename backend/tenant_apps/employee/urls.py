from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tenant_apps.employee.views import EmployeeViewSet, SetPasswordView, UserProfileView, ValidateSetPasswordTokenView

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
    path('validate-set-password/', ValidateSetPasswordTokenView.as_view(), name="validate-set-password"),
    path('set-password/', SetPasswordView.as_view(), name='set_password'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]