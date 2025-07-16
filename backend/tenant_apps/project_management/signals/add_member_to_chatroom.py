from django.db.models.signals import post_save
from django.dispatch import receiver
from tenant_apps.project_management.models import ProjectMember
from tenant_apps.communication.models import ChatRoom

@receiver(post_save, sender=ProjectMember)
def add_member_to_chatroom(sender, instance, created, **kwargs):
    if instance.is_active and instance.project and instance.employee.user:
        try:
            chat_room = ChatRoom.objects.get(project=instance.project, room_type='PROJECT')
            chat_room.participants.add(instance.employee.user)
        except ChatRoom.DoesNotExist:
            pass