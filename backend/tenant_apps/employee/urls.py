from django.urls import path, include
from tenant_apps.employee.views import EmployeeViewSet, SetPasswordView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename = 'employee')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/set-password/', SetPasswordView.as_view(), name='set_password'),
]