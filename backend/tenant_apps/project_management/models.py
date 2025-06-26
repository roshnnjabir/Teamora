# project_management/models.py
from django.db import models
from tenant_apps.employee.models import Employee
from core.constants import TaskStatus, Priority, ProjectStatus

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.PLANNING)
    is_active = models.BooleanField(default=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # The one who created the project (e.g. a PM or tenant admin)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='created_projects')

    members = models.ManyToManyField(Employee, through='ProjectMember', related_name='projects')

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_members")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="project_memberships")
    role = models.CharField(max_length=50)  # e.g. "Developer", "Project Manager", "Tech Lead", "QA Engineer"
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
        return f"{self.developer} reassigned from {self.previous_manager or 'None'} ➜ {self.new_manager or 'None'}"

    
class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)

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