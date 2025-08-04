import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.local')
django.setup()

from tenant_apps.communication.routing import websocket_urlpatterns as communication_ws
from tenant_apps.notifications.routing import websocket_urlpatterns as notifications_ws
from backend.middleware.asgi.tenant_asgi_middleware import TenantASGIMiddleware
from backend.middleware.asgi.jwt_auth_middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TenantASGIMiddleware(
        JWTAuthMiddleware(
            URLRouter(communication_ws + notifications_ws)
        )
    ),
})
