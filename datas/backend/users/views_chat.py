# Create your views here.
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
# We import our serializer here
from websockets.models import Message, ChatRoom
from .serializers import ChatMessageSerializer
from django.contrib.auth import get_user_model 
from django.views.decorators.csrf import csrf_protect

from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404, redirect



User = get_user_model()

# @method_decorator(csrf_protect, name='dispatch')
class ChatMessageHistory(APIView):
	# Cette méthode gère les requêtes POST
	def get(self, request, friend_id):
		try:
			other_user = User.objects.get(id=friend_id)
		except User.DoesNotExist:
			return Response({"error": "User not found"}, 204)
		
		room_name = f"room_{min(request.user.id, other_user.id)}_{max(request.user.id, other_user.id)}"
		try :
			chat_room = ChatRoom.objects.get(name=room_name)
		except ChatRoom.DoesNotExist:
			return Response({"error": "ChatRoom not found"}, 204)
		
		
		# messages de la chatroom, trie par date, limite a 20
		messages = Message.objects.filter(chat_room=chat_room)
		serializer = ChatMessageSerializer(messages, many=True)

		return Response(serializer.data)