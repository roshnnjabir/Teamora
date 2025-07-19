# serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message, MessageSeen
from shared_apps.custom_auth.models import User
from tenant_apps.project_management.models import Project


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    seen_by = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'timestamp', 'seen_by']
    
    def get_sender_name(self, obj):
        user = obj.sender
        return user.name or user.email or f"User {user.id}"    

    def get_seen_by(self, obj):
        return [seen.user.id for seen in obj.seen_by.all()]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'name', 'is_active'] 


class ProjectMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'is_active']


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True)
    project = ProjectMiniSerializer(read_only=True) 
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'room_type', 'participants', 'project', 'last_message']
    
    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_last_message(self, obj):
        message = obj.messages.order_by('-timestamp').first()
        if message:
            return MessageSerializer(message).data
        return None