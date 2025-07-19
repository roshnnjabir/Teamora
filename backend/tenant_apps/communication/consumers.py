from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django_tenants.utils import schema_context
from django.apps import apps
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("ChatConsumer connect called")
        print(f"[WS CONNECT] User: {self.scope.get('user')}")
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f"chat_{self.room_id}"
        print("STEP 1")
        print(self.scope["user"])

        if not self.scope["user"].is_authenticated:
            await self.close(code=4401)
            return
        print("NEXT STEP")

        try:
            await self.validate_user_in_room()
        except Exception as e:
            print(f"Unauthorized attempt to connect to room {self.room_id}: {e}")
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.mark_user_online()

    async def disconnect(self, close_code):
        print(f"[WS DISCONNECT] Code: {close_code}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.mark_user_offline()

    async def receive(self, text_data):
        print(f"[WS RECEIVE] {text_data}")
        data = json.loads(text_data)
        message = data.get('message')
        temp_id = data.get('temp_id')
        sender_id = self.scope["user"].id

        if data.get("type") == "seen":
            await self.mark_message_seen(data["message_id"], sender_id)

        elif message:
            message_obj = await self.save_message(sender_id, message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_obj.content,
                    'sender_id': sender_id,
                    'sender_name': message_obj.sender.get_full_name() or message_obj.sender.email,
                    'timestamp': message_obj.timestamp.isoformat(),
                    'id': str(message_obj.id),
                    'temp_id': temp_id,
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp'],
            'id': event['id'],
            'temp_id': event.get('temp_id'),
        }))

    @database_sync_to_async
    def save_message(self, sender_id, content):
        ChatRoom = apps.get_model('communication', 'ChatRoom')
        Message = apps.get_model('communication', 'Message')
        User = apps.get_model('custom_auth', 'User')
        schema_name = self.scope["tenant"].schema_name

        with schema_context(schema_name):
            room = ChatRoom.objects.get(id=self.room_id)
            user = User.objects.get(id=sender_id)
            return Message.objects.create(room=room, sender=user, content=content)

    @database_sync_to_async
    def mark_user_online(self):
        from .presence import set_user_online
        set_user_online(self.scope['user'].id)

    @database_sync_to_async
    def mark_user_offline(self):
        from .presence import set_user_offline
        set_user_offline(self.scope['user'].id)

    @database_sync_to_async
    def mark_message_seen(self, message_id, user_id):
        Message = apps.get_model('communication', 'Message')
        MessageSeen = apps.get_model('communication', 'MessageSeen')
        User = apps.get_model('custom_auth', 'User')
        schema_name = self.scope["tenant"].schema_name

        with schema_context(schema_name):
            message = Message.objects.get(id=message_id)
            user = User.objects.get(id=user_id)
            MessageSeen.objects.get_or_create(message=message, user=user)

    @database_sync_to_async
    def validate_user_in_room(self):
        ChatRoom = apps.get_model('communication', 'ChatRoom')
        schema_name = self.scope["tenant"].schema_name
        print("SCHEMA NAME:", schema_name)

        with schema_context(schema_name):
            room = ChatRoom.objects.get(id=self.room_id)
            if not room.participants.filter(id=self.scope["user"].id).exists():
                raise PermissionError("User not a participant in the chat room")