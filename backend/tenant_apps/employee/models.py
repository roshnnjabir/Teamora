# employee/models.py (in tenant schema)
from django.db import models
from core.constants import UserRoles

class Employee(models.Model):
    user = models.OneToOneField('custom_auth.User', on_delete=models.CASCADE, related_name='employee')
    full_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    date_joined = models.DateField()

    @property
    def tenant(self):
        return self.user.tenant

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class ProjectManagerAssignment(models.Model):
    manager = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='devs_under_pm')
    developer = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assigned_pm')
    assigned_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='assignments_made')
    assigned_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.manager.role != UserRoles.PROJECT_MANAGER:
            raise ValidationError("Manager must have role 'Project Manager'.")
        if self.developer.role != UserRoles.DEVELOPER:
            raise ValidationError("Developer must have role 'Developer'.")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['developer'], name='unique_developer_assignment')
        ]

    def __str__(self):
        return f"{self.manager} ➜ {self.developer}"


class Notification(models.Model):
    recipient = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    url = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"To {self.recipient.full_name}: {self.message[:30]}"