from django.urls import path
from .consumer import ChatConsumer, GeneralNotificationConsumer
from .pongConsumer import PongConsumer
import uuid


urlpatterns = [
	path('ws/notify/', GeneralNotificationConsumer.as_asgi()),
    path('ws/msg/<str:friend_id>/', ChatConsumer.as_asgi()),
    path('ws/pong/<str:match_id>/', PongConsumer.as_asgi()),
]
