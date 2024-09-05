from django.contrib import admin

# Register your models here.
from .models import Notification, Message, ChatRoom

# 👇 2. Add this line to add the notification
admin.site.register(Notification)
admin.site.register(Message)
admin.site.register(ChatRoom)
