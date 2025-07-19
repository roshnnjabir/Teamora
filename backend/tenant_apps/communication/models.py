from django.db import models
import uuid

class ChatRoom(models.Model):
    ROOM_TYPES = [
        ('PROJECT', 'Project'),
        ('PRIVATE', 'Private'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    participants = models.ManyToManyField('custom_auth.User', related_name='chat_rooms')
    project = models.ForeignKey('project_management.Project', null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room_type', 'project')


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey('custom_auth.User', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}"


class MessageSeen(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='seen_by')
    user = models.ForeignKey('custom_auth.User', on_delete=models.CASCADE)
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')