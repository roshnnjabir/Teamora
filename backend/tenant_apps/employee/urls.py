from django.urls import path
from tenant_apps.employee.views import EmployeeCreateView

urlpatterns = [
    path('employees/create/', EmployeeCreateView.as_view(), name='employee-create'),
]