# tenant_apps/notifications/utils/notification_utils.py

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

def send_realtime_notification(notification):
    """
    Sends a WebSocket notification to the user's group.
    """
    channel_layer = get_channel_layer()
    user_id = notification.recipient.user.id
    group_name = f"user_notifications_{user_id}"

    payload = {
        "type": "send.notification",
        "id": notification.id,
        "message": notification.message,
        "url": notification.url,
        "created_at": notification.created_at.isoformat(),
        "is_read": notification.is_read,
    }

    logger.info(f"🔄 Sending WebSocket notification to group {group_name}: {payload}")

    async_to_sync(channel_layer.group_send)(
        group_name,
        payload
    )