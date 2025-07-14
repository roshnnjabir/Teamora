# project_management/serializers.py
from rest_framework import serializers
from rest_framework import generics
from django.db import transaction
from tenant_apps.project_management.models import (
    Project,
    ProjectMember,
    Task,
    Subtask,
    Label,
    Comment,
    DeveloperAssignmentAuditLog,
    SubtaskAssignmentAudit,
)
from tenant_apps.employee.models import Employee, ProjectManagerAssignment
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from core.constants import UserRoles
from datetime import date


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'employee', 'role', 'joined_at']
        read_only_fields = ['joined_at']


class SimpleEmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = Employee
        fields = ["id", "full_name", "email"]


class ProjectManagerAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectManagerAssignment
        fields = ['id', 'manager', 'developer', 'assigned_by', 'assigned_at']
        read_only_fields = ['id', 'assigned_by', 'assigned_at']

    def validate(self, data):
        if data['manager'].role != UserRoles.PROJECT_MANAGER:
            raise serializers.ValidationError("Assigned manager must be a Project Manager.")
        if data['developer'].role != UserRoles.DEVELOPER:
            raise serializers.ValidationError("Assigned developer must be a Developer.")
        return data

    def create(self, validated_data):
        developer = validated_data['developer']
        manager = validated_data['manager']
        assigned_by = self.context['request'].user.employee

        existing = ProjectManagerAssignment.objects.filter(developer=developer).first()
        if existing.manager == manager:
            raise serializers.ValidationError("Developer is already assigned to this manager.")
        if existing:
            existing.manager = manager
            existing.assigned_by = assigned_by
            existing.save()
            return existing

        return ProjectManagerAssignment.objects.create(
            manager=manager,
            developer=developer,
            assigned_by=assigned_by
        )


class ProjectMemberDetailSerializer(serializers.ModelSerializer):
    employee = SimpleEmployeeSerializer()

    class Meta:
        model = ProjectMember
        fields = ['id', 'employee', 'role', 'joined_at']


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    content_type = serializers.CharField(write_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "author_name", "text", "created_at", "content_type", "object_id"]
        read_only_fields = ["id", "created_at", "author", "author_name"]

    def validate_content_type(self, value):
        try:
            return ContentType.objects.get(model=value)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"Invalid content type: '{value}'")

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user.employee
        return super().create(validated_data)


class SubtaskSerializer(serializers.ModelSerializer):
    task = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all())
    assigned_to = SimpleEmployeeSerializer(read_only=True)
    project = serializers.SerializerMethodField()
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True,
    )
    labels = LabelSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Subtask
        fields = [
            'id', 'task', 'title', 'description', 'due_date', 'status',
            'priority', 'assigned_to', 'assigned_to_id',
            'created_by', 'created_at', 'labels', 'comments',
            'project', 'estimated_hours', 
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def validate_assigned_to(self, value):
        if value is None:
            return value 

        task = self.initial_data.get("task")
        if not task:
            task = getattr(self.instance, "task", None)

        if not task:
            raise serializers.ValidationError("Task is required.")

        project_id = Task.objects.get(id=task).project_id
        is_member = ProjectMember.objects.filter(
            employee=value,
            project_id=project_id,
            is_active=True
        ).exists()

        if not is_member:
            raise serializers.ValidationError("Assigned employee is not a member of the task's project.")

        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Subtask title is required.")
        return value

    def validate_description(self, value):
        if value and len(value.strip()) < 5:
            raise serializers.ValidationError("Subtask description must be at least 5 characters.")
        return value

    def validate_due_date(self, value):
        if value is None:
            return value 
        if value < date.today():
            raise serializers.ValidationError("Due date cannot be in the past.")

        task = self.initial_data.get("task") or (self.instance and self.instance.task.id)
        if not task:
            return value

        try:
            task_obj = Task.objects.get(id=task)
            project = task_obj.project
            if task_obj.due_date and value > task_obj.due_date:
                raise serializers.ValidationError("Subtask due date cannot exceed parent task's due date.")
            if project.end_date and value > project.end_date:
                raise serializers.ValidationError("Subtask due date cannot exceed project end date.")
        except Task.DoesNotExist:
            raise serializers.ValidationError("Invalid task ID.")

        return value

    def validate(self, data):
        title = data.get("title") or (self.instance and self.instance.title)
        description = data.get("description") or (self.instance and self.instance.description)
        task = data.get("task") or (self.instance and self.instance.task)
    
        if title and description and task:
            qs = Subtask.objects.filter(title=title, description=description, task=task)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError({
                    "non_field_errors": ["A subtask with the same title and description already exists in this task."]
                })
    
        return data

    def get_project(self, obj):
        project = obj.task.project
        return {
            "id": project.id,
            "is_active": project.is_active,
        }

    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Validated data: {validated_data}") 
        validated_data['created_by'] = self.context['request'].user.employee
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    label_ids = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(),
        many=True,
        write_only=True,
        source="labels",
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description',
            'due_date', 'status', 'priority', 'created_at',
            'created_by', 'updated_at', 'subtasks', 'comments',
            'labels', 'label_ids'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Task title is required.")
        return value

    def validate_description(self, value):
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters.")
        return value

    def validate_due_date(self, value):
        if value is None:
            return value

        if value < date.today():
            raise serializers.ValidationError("Due date cannot be in the past.")

        project_id = self.initial_data.get("project")
        if not project_id and self.instance:
            project_id = getattr(self.instance, "project_id", None)

        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                if project.start_date and value < project.start_date:
                    raise serializers.ValidationError("Due date cannot be before project start date.")
                if project.end_date and value > project.end_date:
                    raise serializers.ValidationError("Due date cannot be after project end date.")
            except Project.DoesNotExist:
                raise serializers.ValidationError("Project not found.")

        return value

    def validate(self, data):
        title = data.get("title")
        project = data.get("project")

        if title and project:
            existing = Task.objects.filter(title=title, project=project)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)

            if existing.exists():
                raise serializers.ValidationError({
                    "non_field_errors": ["A task with this title already exists in the project."]
                })

        return data

    def update(self, instance, validated_data):
        user = self.context['request'].user

        if user.role == UserRoles.DEVELOPER:
            allowed_fields = ['status']
            validated_data = {k: v for k, v in validated_data.items() if k in allowed_fields}

        return super().update(instance, validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    tasks = TaskSerializer(many=True, read_only=True, source='task_set')

    def get_members(self, obj):
        members = ProjectMember.objects.filter(project=obj, is_active=True)
        return ProjectMemberDetailSerializer(members, many=True).data

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date',
            'created_by', 'assigned_pm', 'members', 'tasks',
            'status', 'is_active', 'priority'
        ]
        read_only_fields = ['id', 'created_by']
        validators = []

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Project name is required.")
        return value

    def validate_description(self, value):
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        return value

    def validate(self, data):
        start = data.get('start_date') or getattr(self.instance, 'start_date', None)
        end = data.get('end_date') or getattr(self.instance, 'end_date', None)

        if start and end and end < start:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        if (
            self.instance and 
            'start_date' in data and 
            data['start_date'] != self.instance.start_date and 
            self.instance.status != 'planning'
        ):
            raise serializers.ValidationError({
                "start_date": "Start date can only be edited while the project is in planning."
            })

        if self.instance is None and start and start < date.today():
            raise serializers.ValidationError({
                "start_date": "Start date cannot be in the past."
            })
        name = data.get('name', getattr(self.instance, 'name', None))
        description = data.get('description', getattr(self.instance, 'description', None))

        if name and description:
            qs = Project.objects.filter(name=name, description=description)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    "non_field_errors": ["A project with the same name and description already exists."]
                })

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        creator = request.user.employee
        validated_data.pop('created_by', None)

        assigned_pm = validated_data.pop('assigned_pm', None)

        user = request.user

        if user.is_tenant_admin:
            if not assigned_pm:
                raise serializers.ValidationError({
                    'assigned_pm': 'Tenant admin must assign a project manager.'
                })
        elif user.is_project_manager:
            assigned_pm = creator
        else:
            raise serializers.ValidationError({
                'non_field_errors': ['You are not allowed to create a project.']
            })

        try:
            with transaction.atomic():
                project = Project.objects.create(
                    **validated_data,
                    created_by=creator,
                    assigned_pm=assigned_pm or creator
                )

                ProjectMember.objects.create(
                    project=project,
                    employee=assigned_pm or creator,
                    role=UserRoles.PROJECT_MANAGER,
                    is_active=True
                )

                return project

        except IntegrityError:
            raise ValidationError({
                "non_field_errors": ["A project with the same name and description already exists."]
            })


class DeveloperAssignmentAuditLogSerializer(serializers.ModelSerializer):
    developer = SimpleEmployeeSerializer(read_only=True)
    previous_manager = SimpleEmployeeSerializer(read_only=True)
    new_manager = SimpleEmployeeSerializer(read_only=True)
    assigned_by = SimpleEmployeeSerializer(read_only=True)

    class Meta:
        model = DeveloperAssignmentAuditLog
        fields = ['id', 'developer', 'previous_manager', 'new_manager', 'assigned_by', 'assigned_at']


class SubtaskAssignmentAuditSerializer(serializers.ModelSerializer):
    previous_assignee = SimpleEmployeeSerializer(read_only=True)
    new_assignee = SimpleEmployeeSerializer(read_only=True)
    changed_by = SimpleEmployeeSerializer(read_only=True)

    class Meta:
        model = SubtaskAssignmentAudit
        fields = ['id', 'subtask', 'previous_assignee', 'new_assignee', 'changed_by', 'timestamp']