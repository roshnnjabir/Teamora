from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import ChatRoom, Message
from django.db.models import Count
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CreatePrivateChatRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        participants = request.data.get('participants', [])
        room_type = 'PRIVATE'
        current_user_id = str(request.user.id)

        if current_user_id not in [str(p) for p in participants]:
            raise PermissionDenied("You must be one of the participants.")

        if len(participants) != 2:
            raise ValidationError("Private chat must have exactly 2 participants.")
        
        participant_ids = sorted(participants)

        existing = ChatRoom.objects.annotate(num_participants=Count('participants'))\
            .filter(room_type='PRIVATE', participants__id__in=participant_ids)\
            .filter(num_participants=2)

        for room in existing:
            room_ids = sorted([str(u.id) for u in room.participants.all()])
            if room_ids == participant_ids:
                serializer = ChatRoomSerializer(room)
                return Response(serializer.data, status=status.HTTP_200_OK)

        room = ChatRoom.objects.create(room_type=room_type)
        room.participants.set(User.objects.filter(id__in=participants))
        serializer = ChatRoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatRoomListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = ChatRoom.objects.filter(participants=request.user).order_by('-created_at')
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)


class ChatRoomMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id, participants=request.user)
        except ChatRoom.DoesNotExist:
            return Response({"detail": "Chat room not found."}, status=404)

        messages = Message.objects.filter(room=room).order_by('-timestamp')[:100]
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)