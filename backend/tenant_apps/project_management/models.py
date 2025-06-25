# project_management/models.py
from django.db import models
from tenant_apps.employee.models import Employee

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # The one who created the project (e.g. a PM or tenant admin)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_projects')

    members = models.ManyToManyField(Employee, through='ProjectMember', related_name='projects')

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    role = models.CharField(max_length=50)  # e.g. "Developer", "Project Manager"
    joined_at = models.DateField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'employee'], name='unique_project_member')
        ]


class AssignmentAuditLog(models.Model):
    developer = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="assignment_audits")
    previous_manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    new_manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    assigned_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs_made")
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.developer} reassigned from {self.previous_manager} ➜ {self.new_manager}"

    
class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=[
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ], default='todo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], default='medium')

    def __str__(self):
        return self.title


class Subtask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_subtasks')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title