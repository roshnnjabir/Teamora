# project_management/serializers.py
from rest_framework import serializers
from rest_framework import generics
from tenant_apps.project_management.models import Project, ProjectMember, Task, Subtask, AssignmentAuditLog
from tenant_apps.employee.models import Employee, ProjectManagerAssignment
from core.constants import UserRoles
import datetime


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


class ProjectSerializer(serializers.ModelSerializer):
    members = SimpleEmployeeSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date',
            'created_by', 'members', 'status', 'is_active', 'priority'
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

        if start and start < datetime.date.today():
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
            role="Project Manager"
        )

        return project


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'project', 'title', 'description', 'assigned_to', 'due_date', 'status', 'priority', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'task', 'title', 'is_completed', 'assigned_to', 'created_at']
        read_only_fields = ['id', 'created_at']


class AssignmentAuditLogSerializer(serializers.ModelSerializer):
    developer = SimpleEmployeeSerializer(read_only=True)
    previous_manager = SimpleEmployeeSerializer(read_only=True)
    new_manager = SimpleEmployeeSerializer(read_only=True)
    assigned_by = SimpleEmployeeSerializer(read_only=True)

    class Meta:
        model = AssignmentAuditLog
        fields = ['id', 'developer', 'previous_manager', 'new_manager', 'assigned_by', 'assigned_at']