import json
from uuid import UUID
from rest_framework.test import APIRequestFactory
from users.views_login import CustomLogoutView
from rest_framework import status
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from users.serializers import UserSerializer
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse, HttpResponse
#from channels.auth import channel_session_user_from_http, channel_session_user
from .models import ChatRoom
from datetime import datetime
User = get_user_model()

from .models import Message, Notification

class ChatConsumer(AsyncWebsocketConsumer):
	
	async def connect(self):
		self.user = self.scope["user"]
		if self.user.is_anonymous:
			await self.close()
		self.friend_id = self.scope["url_route"]["kwargs"]["friend_id"]

		try:
			self.other_user = await User.objects.aget(id=self.friend_id)
		except User.DoesNotExist:
			await self.close()
		
		self.room_name = f"room_{min(self.user.id, self.other_user.id)}_{max(self.user.id, self.other_user.id)}"
		self.room_group_name = f"chat_{self.room_name}"

		# Ensure the chat room exists or create it
		self.chat_room, created = await database_sync_to_async(ChatRoom.objects.get_or_create)(
			name=self.room_name
		)
		if created:
			await database_sync_to_async(self.chat_room.users.add)(self.user)
			await database_sync_to_async(self.chat_room.users.add)(self.other_user)
		
		existing_users = await database_sync_to_async(list)(self.chat_room.users.all())

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)
		# Join room group
		await self.accept()
		#@channel_session_user


	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

	# Receive message from WebSocket
	#@channel_session_user
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]

		# Send message to room group
		await self.channel_layer.group_send(
			self.room_group_name, {"type": "chat.message", "message": message, "user": self.user}
		)
		#new_notif = Notification(message=message)
		#await self.create_notification(new_notif) """
		# Save message to database
		
		message_saved = await self.save_message(message)
		
		# creer notif 
		await self.create_notif(message)

	@database_sync_to_async
	def create_notif(self, message):
		if message == "\n" or message == "":
			return
		notif_message = f'{self.user.username} has sent me a message'
		Notification.objects.create(
			type="private",
			code_name="MSG",
			code_value=5,
			message=notif_message,
			sender=self.user,
			receiver=self.other_user,
			link=None
		)
		# user.SetStatus(User.USER_STATUS['WAITING_FRIEND'])
		# return HttpResponse("Invitation sent!")


	# Receive message from room group
	@database_sync_to_async
	def save_message(self, message):

		Message.objects.create(message=message, user=self.user, chat_room=self.chat_room)
		return Message.objects.last()

	async def chat_message(self, event):
		message = event["message"]
		user = event["user"]
		if message == "\n" or message == "":
			return

		# Send message to WebSocket
		await self.send(text_data=json.dumps(
			{"message": message,
			"username": user.username,
			"user_id" : str(user.id),
			"avatar" : user.avatar,
			"created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
		}))

	# @sync_to_async
	# def is_blocked(self, user, other_user):
	# 	return other_user.blocks.filter(pk=user.pk).exists()


class GeneralNotificationConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope["user"]
		if isinstance(self.user, AnonymousUser):
			await self.accept()
			await self.send(text_data=json.dumps({"error": "token_not_valid"}))
			await self.close()
			return
		# add user to channels 
		await self.channel_layer.group_add("public_room", self.channel_name)
		await self.channel_layer.group_add(f"{self.user.id}", self.channel_name)
		# set user status to ONLINE if necessay & send a notification to users
		if self.user.status == User.USER_STATUS['OFFLINE']:
			self.user.status = User.USER_STATUS['ONLINE']
			await sync_to_async(self.user.save, thread_sensitive=True)()
			await sync_to_async(Notification.objects.create)(type="public",code_name="STA",code_value=self.user.status,sender=self.user,receiver=self.user,link=None)
		await self.accept()

	async def disconnect(self, close_code):
		try:
			# remove user from channels 
			await self.channel_layer.group_discard("public_room", self.channel_name)
			await self.channel_layer.group_discard(f"{self.user.id}", self.channel_name)
			# set user status to OFFLINE & send a notification to users
			self.user.status = User.USER_STATUS['OFFLINE']
			# await sync_to_async(self.user.save, thread_sensitive=True)()
			await sync_to_async(Notification.objects.create)(type="public",code_name="STA",code_value=self.user.status,sender=self.user,receiver=self.user,link=None)

		except Exception as e:
			print("Error:", str(e))


	async def send_notification(self, event):
		sender = event['sender']
		sender_id = str(sender) if isinstance(sender, UUID) else sender.id
		await self.send(text_data=json.dumps({ 
			   'code_name': event['code_name'],
			   'code_value': event['code_value'],
			   'message': event['message'],
			   'link': event['link'],
			   'sender': sender_id
			}))
