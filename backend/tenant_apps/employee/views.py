# employee/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from tenant_apps.employee.serializers import EmployeeCreateSerializer
from core.permissions import IsTenantAdmin

class EmployeeCreateView(generics.CreateAPIView):
    serializer_class = EmployeeCreateSerializer
    permission_classes = []

    def get_queryset(self):
        tenant = self.request.tenant
        from django_tenants.utils import schema_context
        with schema_context(tenant.schema_name):
            return Employee.objects.all()