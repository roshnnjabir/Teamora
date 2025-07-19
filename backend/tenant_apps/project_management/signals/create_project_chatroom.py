from django.db.models.signals import post_save
from django.dispatch import receiver
from tenant_apps.project_management.models import Project
from tenant_apps.communication.models import ChatRoom

@receiver(post_save, sender=Project)
def create_project_chatroom(sender, instance, created, **kwargs):
    if created:
        ChatRoom.objects.get_or_create(
            room_type="PROJECT",
            project=instance
        )