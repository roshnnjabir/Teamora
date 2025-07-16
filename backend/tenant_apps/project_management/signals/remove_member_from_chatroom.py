from django.db.models.signals import pre_save
from django.dispatch import receiver
from tenant_apps.project_management.models import ProjectMember
from tenant_apps.communication.models import ChatRoom

@receiver(pre_save, sender=ProjectMember)
def remove_member_from_chatroom(sender, instance, **kwargs):
    try:
        old_instance = ProjectMember.objects.get(pk=instance.pk)
    except ProjectMember.DoesNotExist:
        return

    if old_instance.is_active and not instance.is_active:
        try:
            chat_room = ChatRoom.objects.get(project=instance.project, room_type='PROJECT')
            chat_room.participants.remove(instance.employee.user)
        except ChatRoom.DoesNotExist:
            pass