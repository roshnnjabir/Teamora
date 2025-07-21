from django.db import models
from tenant_apps.employee.models import Employee

# Create your models here.
class Notification(models.Model):
    recipient = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    url = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"To {self.recipient.full_name}: {self.message[:30]}"