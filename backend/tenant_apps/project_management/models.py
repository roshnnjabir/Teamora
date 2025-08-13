# project_management/models.py
from django.db import models
from tenant_apps.employee.models import Employee
from django.conf import settings
from core.constants import TaskStatus, Priority, ProjectStatus
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType


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
    assigned_pm = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_projects')

    members = models.ManyToManyField(Employee, through='ProjectMember', related_name='projects')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name', 'description'], name='unique_project_name_description')
        ]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_members")
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="project_memberships")
    is_active = models.BooleanField(default=True)
    role = models.CharField(max_length=50)  # e.g. "Developer", "Project Manager", "Tech Lead", "QA Engineer"
    joined_at = models.DateField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'employee'], name='unique_project_member')
        ]


class DeveloperAssignmentAuditLog(models.Model):
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
    labels = models.ManyToManyField('Label', blank=True, related_name='tasks')
    comments = GenericRelation('Comment', related_query_name='task_comments')
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['title', 'project'], name='unique_task_title_per_project')
        ]

    def __str__(self):
        return self.title


class Subtask(models.Model):
    task = models.ForeignKey(Task, related_name='subtasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    labels = models.ManyToManyField('Label', blank=True, related_name='subtasks')
    comments = GenericRelation('Comment', related_query_name='subtask_comments')
    due_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='subtasks')
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=TaskStatus.choices)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    created_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_subtasks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['task', 'title', 'description'],
                name='unique_subtask_per_task'
            )
        ]

    @property
    def schema_name(self):
        return self.task.project.created_by.user.tenant.schema_name


    def __str__(self):
        return self.title


class SubtaskAssignmentAudit(models.Model):
    subtask = models.ForeignKey(Subtask, on_delete=models.CASCADE, related_name='assignment_audits')
    previous_assignee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='previous_subtasks')
    new_assignee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='new_subtasks')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)


class SubtaskAuditLogRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    requested_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='audit_requests')
    approved_by = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_audit_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)


class Label(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#3498db", unique=True)
    created_by = models.ForeignKey(
        Employee, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="created_labels"
    )

    def __str__(self):
        return self.name


class Comment(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    author = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.full_name} on {self.content_type} {self.object_id}"