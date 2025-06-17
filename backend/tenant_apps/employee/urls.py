from django.urls import path, include
from tenant_apps.employee.views import EmployeeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename = 'employee')

urlpatterns = [
    path('api/', include(router.urls)),
]