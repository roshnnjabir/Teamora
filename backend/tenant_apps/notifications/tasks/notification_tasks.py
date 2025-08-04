# tenant_apps/notifications/tasks/notification_tasks.py

from celery import shared_task
from django.utils.timezone import now
from django_tenants.utils import schema_context
from django.db import transaction

from tenant_apps.notifications.models import Notification
from tenant_apps.employee.models import Employee
from tenant_apps.notifications.utils.notification_utils import send_realtime_notification

@shared_task
def send_notification_task(schema_name, recipient_id, message, url=None):
    """
    Creates a notification and broadcasts it via WebSocket.
    """
    with schema_context(schema_name):
        try:
            recipient = Employee.objects.select_related('user').get(id=recipient_id)

            with transaction.atomic():
                notification = Notification.objects.create(
                    recipient=recipient,
                    message=message,
                    url=url,
                    created_at=now()
                )

                # WebSocket push
                send_realtime_notification(notification)

        except Employee.DoesNotExist:
            # Optionally log or handle failure
            pass