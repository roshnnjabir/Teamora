from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tenant_apps.employee.views import EmployeeViewSet, SetPasswordView

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
    path('set-password/', SetPasswordView.as_view(), name='set_password'),
]