from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
import uuid
from django.conf import settings
# from websockets.models import Notification

class User(AbstractUser):
    # USER_STATUS cf. front contstants.js
    USER_STATUS = {
        'OFFLINE' : 0,
        'ONLINE' : 1,
        'PLAYING' : 2,
        'WAITING_PLAYER' : 3,
        'WAITING_FRIEND' : 4,
        'WAITING_TOURNAMENT' : 5
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.TextField(max_length=500, blank=True, default="/avatars/default.png")
    biography = models.TextField(max_length=500, blank=True)
    id_42 = models.IntegerField(default=0)
    status = models.IntegerField(default=0)
    follows = models.ManyToManyField(
        "self",
        related_name="followed_by",
        symmetrical=False,
        blank=True
    )
    blocks = models.ManyToManyField(
        "self",
        related_name="blocked_by",
        symmetrical=False,
        blank=True
    )
    first_name = models.CharField(max_length=30, blank=True, validators=[MinLengthValidator(1)])
    last_name = models.CharField(max_length=150, blank=True, validators=[MinLengthValidator(1)])
    invitations_sent = models.ManyToManyField(
        'Invitation',
        blank=True,
        related_name='invitation_sender',
        verbose_name='Invitation sent'
    )
    otp = models.CharField(max_length=6, blank=True)
    otp_expiry_time = models.DateTimeField(blank=True, null=True)

    def SetStatus(self, status):
        self.status = status
        self.save()
        from websockets.models import Notification
        Notification.objects.create(
            type="public",
            code_name=f"STA",
            code_value=status,
            sender=self,
            receiver=self,
            link=None
        )

class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='sent_invitations',
        on_delete=models.CASCADE
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_invitations',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')