"""
ASGI config for hello_django project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from websockets.middlewares import WebSocketJWTAuthMiddleware

from channels.routing import ProtocolTypeRouter, URLRouter

from websockets.urls import urlpatterns as ws_urlpatterns
import django


#os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hello_django.settings')



application = ProtocolTypeRouter({
	'http':  get_asgi_application(),
	'websocket': WebSocketJWTAuthMiddleware(URLRouter(ws_urlpatterns))
})
