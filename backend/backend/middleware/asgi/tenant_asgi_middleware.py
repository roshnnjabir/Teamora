from django_tenants.utils import schema_context
from django.db import connection
from channels.db import database_sync_to_async
from shared_apps.tenants.models import Client, Domain

class TenantASGIMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        host = dict(scope["headers"]).get(b"host", b"").decode().split(":")[0]

        try:
            domain = await database_sync_to_async(
                Domain.objects.select_related("tenant").get
            )(domain=host)

            scope["tenant"] = domain.tenant
            connection.set_schema(domain.tenant)

        except Domain.DoesNotExist:
            await send({
                "type": "websocket.close",
                "code": 4401  # Unauthorized
            })
            return

        return await self.inner(scope, receive, send)