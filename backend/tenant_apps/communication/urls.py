from django.urls import path
from .views import CreatePrivateChatRoomView, ChatRoomMessagesView, ChatRoomListView

urlpatterns = [
    path('private-chat/', CreatePrivateChatRoomView.as_view(), name='create-private-chat'),
    path('chat-rooms/', ChatRoomListView.as_view(), name='chatroom-list'),
    path('chat-rooms/<uuid:room_id>/messages/', ChatRoomMessagesView.as_view(), name='chatroom-messages'),
]