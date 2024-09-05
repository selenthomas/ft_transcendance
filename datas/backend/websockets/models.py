from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

# 1. 👇 Add the following line
class Notification(models.Model):
    type = models.CharField(max_length=100, default='public')
    code_name = models.CharField(max_length=3, default="000")
    code_value = models.IntegerField(default=0)
    message = models.CharField(max_length=800)
    sender = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="sender", null=True, blank=True)
    receiver = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="receiver", null=True, blank=True)
    link = models.CharField(max_length=100, null=True, blank=True)
    
    

class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    users = models.ManyToManyField(User)

    def __str__(self):
        return self.name

class Message(models.Model):
    # id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_room = models.ForeignKey(ChatRoom, null=True, blank=True, on_delete=models.CASCADE)
    message = models.JSONField()
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
