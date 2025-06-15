# hr/models.py (in tenant schema)
from django.db import models
from core.constants import UserRoles

class Employee(models.Model):
    user = models.ForeignKey('custom_auth.User', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=UserRoles.choices)
    department = models.CharField(max_length=100)
    date_joined = models.DateField()