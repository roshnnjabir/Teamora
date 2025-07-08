# project_management/serializers.py
from rest_framework import serializers
from rest_framework import generics
from tenant_apps.project_management.models import Project, ProjectMember, Task, Subtask, DeveloperAssignmentAuditLog
from tenant_apps.employee.models import Employee, ProjectManagerAssignment
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


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'task', 'title', 'is_completed', 'assigned_to', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'assigned_to',
            'due_date', 'status', 'priority', 'created_at',
            'created_by', 'updated_at', 'subtasks'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def validate_due_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Due date cannot be in the past.")

        project_id = self.initial_data.get("project") or self.instance.project_id
        if project_id:
            project = Project.objects.get(id=project_id)
            if project.start_date and value < project.start_date:
                raise serializers.ValidationError("Due date cannot be before project start date.")
            if project.end_date and value > project.end_date:
                raise serializers.ValidationError("Due date cannot be after project end date.")
        return value

    def validate_assigned_to(self, value):
        """
        Ensure that the assigned developer is an active member of the project.
        """
        if not value:
            return value

        project = self.initial_data.get("project")
        if not project:
            project = getattr(self.instance, "project", None)

        if not project:
            raise serializers.ValidationError("Project context is required.")

        from tenant_apps.project_management.models import ProjectMember

        is_member = ProjectMember.objects.filter(
            employee=value,
            project_id=project,
            is_active=True
        ).exists()

        if not is_member:
            raise serializers.ValidationError("This employee is not an active member of the project.")

        return value

    def get_project(self, obj):
        return {
            "id": obj.project.id,
            "name": obj.project.name,
        } if obj.project else None

    def update(self, instance, validated_data):
        user = self.context['request'].user
    
        # Only allow developers to change status/priority/description
        if user.role == 'developer':
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
            'created_by', 'members', 'tasks', 'status', 'is_active', 'priority'
        ]
        read_only_fields = ['id', 'created_by']

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

        if start and start < date.today():
            raise serializers.ValidationError({
                "start_date": "Start date cannot be in the past."
            })
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        creator = request.user.employee

        validated_data.pop('created_by', None)

        project = Project.objects.create(**validated_data, created_by=creator)

        ProjectMember.objects.create(
            project=project,
            employee=creator,
            role="Project Manager",
            is_active=True
        )

        return project


class DeveloperAssignmentAuditLogSerializer(serializers.ModelSerializer):
    developer = SimpleEmployeeSerializer(read_only=True)
    previous_manager = SimpleEmployeeSerializer(read_only=True)
    new_manager = SimpleEmployeeSerializer(read_only=True)
    assigned_by = SimpleEmployeeSerializer(read_only=True)

    class Meta:
        model = DeveloperAssignmentAuditLog
        fields = ['id', 'developer', 'previous_manager', 'new_manager', 'assigned_by', 'assigned_at']