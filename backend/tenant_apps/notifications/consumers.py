# notifications/consumers.py

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django_tenants.utils import schema_context
from tenant_apps.notifications.models import Notification
import json


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = f"user_notifications_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Fetch and send last N notifications on connect
        recent_notifications = await self.get_recent_notifications(user)
        for notification in recent_notifications:
            await self.send(text_data=json.dumps({
                "id": notification.id,
                "message": notification.message,
                "url": notification.url,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read,
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "mark_read":
                notification_id = data.get("notification_id")
                if notification_id:
                    await self.mark_notification_read(notification_id)

        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": "Invalid data",
                "details": str(e)
            }))

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from tenant_apps.notifications.models import Notification

        with schema_context(self.scope["tenant"].schema_name):
            try:
                notification = Notification.objects.get(id=notification_id, recipient=self.user.employee)
                notification.is_read = True
                notification.save()
            except Notification.DoesNotExist:
                pass  # Optionally log or handle
    
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "url": event.get("url"),
            "created_at": event.get("created_at"),
        }))

    @database_sync_to_async
    def get_recent_notifications(self, user, limit=20):
        with schema_context(self.scope["tenant"].schema_name):
            return list(
                Notification.objects.filter(recipient=user.employee)
                .order_by("-created_at")[:limit]
            )