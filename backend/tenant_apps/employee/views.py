from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from tenant_apps.employee.serializers import EmployeeSerializer
from tenant_apps.employee.models import Employee
from core.permissions import IsTenantAdmin
from shared_apps.custom_auth.models import User


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return Employee.objects.filter(user__tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    def perform_destroy(self, instance):
        # Also delete the associated user
        user = instance.user
        instance.delete()
        user.delete()