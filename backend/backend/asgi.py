import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.local')
django.setup()

from tenant_apps.communication.routing import websocket_urlpatterns
from backend.middleware.tenant_asgi_middleware import TenantASGIMiddleware
from backend.middleware.jwt_auth_middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TenantASGIMiddleware(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
