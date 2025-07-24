from rest_framework import serializers
from tenant_apps.notifications.models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'url', 'is_read', 'created_at']