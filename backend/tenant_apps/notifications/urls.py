from django.urls import path, include
from tenant_apps.notifications.views import NotificationListView, MarkNotificationReadView

urlpatterns = [
#     path('notifications/', NotificationListView.as_view(), name='notification-list'),
#     path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),
]