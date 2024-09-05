from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
	if created and instance.type == 'public':
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			'public_room',
			{
				"type": "send_notification",
				"code_name": instance.code_name,
				"code_value": instance.code_value,
				"message": instance.message,
				"link": instance.link,
				"sender": instance.sender.id if instance.sender else None
			}
		)
	elif created and instance.type == 'private':
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"{instance.receiver.id}",
			{
				"type": "send_notification",
				"code_name": instance.code_name,
				"code_value": instance.code_value,
				"message": instance.message,
				"link": instance.link,
				"sender": instance.sender.id if instance.sender else None
			}
		)