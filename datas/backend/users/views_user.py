# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status, authentication
# We import our serializer here
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, UpdateUserSerializer
from django.contrib.auth import get_user_model, authenticate, logout, login as django_login
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, OutstandingToken
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from django.core.cache import cache

import random, string
import os
from django.core.files.base import ContentFile
import json
import requests
from django.http import JsonResponse, HttpResponse
from django.views.generic import View
from django.middleware.csrf import get_token
from django.http import Http404
from django.utils.crypto import get_random_string
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404, redirect
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail, BadHeaderError

from websockets.models import Message, Notification

import smtplib
import dns.resolver
from django.core.mail import EmailMessage
from smtplib import SMTPException

User = get_user_model()


class UsersAPIView(APIView):
	permission_classes = [IsAuthenticated]
	serializer_class = UserSerializer

	def get(self, request, req_type):
		if req_type == 'online':
			users = User.objects.exclude(status=0)
		elif req_type == 'all':
			users = User.objects.all()
		elif req_type == 'followed':
			users =  request.user.follows.all()
		if not users:  # Vérifie si la base de données d'utilisateurs est vide
			return Response({"error": "Aucun utilisateur trouvé."}, status=204)
		# Renvoie une réponse avec le code d'état 200 (OK)
		serializer = self.serializer_class(users, many=True)
		return Response(serializer.data, status=200)


class UserDetail(APIView):
	def get_user(self, id):
		return get_object_or_404(User, id=id)

	def get(self, request, id, format=None):
		user = self.get_user(id)
		serializer = UserSerializer(user)
		response_data = serializer.data
		
		response = JsonResponse(response_data, safe=False)
		return response

	def put(self, request, id, format=None):
		user = self.get_user(id)
		if user.id != request.user.id:
			return Response(status=status.HTTP_401_UNAUTHORIZED)
		other_profiles = User.objects.filter(status=User.USER_STATUS['ONLINE']).exclude(id=user.id).all()
		serializer = UpdateUserSerializer(user, data=request.data)
		if serializer.is_valid():
			serializer.save()
			serializer = UserSerializer(user)
			notif_message = f'{user.username} has changed some infos'

			Notification.objects.create(
				type="public",
				code_name="PFL",
				code_value=1,
				message={'username':user.username, 'avatar':user.avatar},
				sender=user,
				receiver=user,
				link=f"/profile/{str(user.id)}"
			)
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FollowUser(APIView):
	permission_classes = [IsAuthenticated]

	def current_profile(self):
		try:
			return self.request.data.get('me')
		except User.DoesNotExist:
			raise Http404
			
	def other_profile(self, pk):
		try:
			return User.objects.get(id = pk)
		except User.DoesNotExist:
			raise Http404

	def get(self, request, req_type, id, format=None):	
		pk = id		 # Here pk is opposite user's profile ID
		# followType = request.data.get('usertype')
		
		current_profile = request.user
		other_profile = self.other_profile(pk)
		response_data = {}
		
		if req_type == 'follow':
			if current_profile.follows.filter(pk = other_profile.id).exists():
				return Response({"Following Fail" : "You can not follow this profile because you are already following this user!"},status=status.HTTP_400_BAD_REQUEST)
			current_profile.follows.add(other_profile)
			# return Response(status=status.HTTP_200_OK) 
			notif_message = f'{current_profile.username} is following me'
			notification = create_notif(current_profile, other_profile, 1, notif_message, "FLW", pk)
			response_data = {'message': 'Followed successfully!'}
			return JsonResponse(response_data)
		
		elif req_type == 'unfollow':
			current_profile.follows.remove(other_profile)
			# return Response(status=status.HTTP_200_OK)
			notif_message = f'{current_profile.username} has unfollowed me'
			notification = create_notif(current_profile, other_profile, 2, notif_message, "FLW", pk)
			response_data = {'message': 'Unfollowed successfully!'}
			return JsonResponse(response_data)


		elif req_type == 'block':
			if current_profile.blocks.filter(pk = other_profile.id).exists():
				return Response({"Blocking Fail" : "You can not block this profile because you are already blocking this user!"},status=status.HTTP_400_BAD_REQUEST)
			current_profile.blocks.add(other_profile)
			notif_message = f'{current_profile.username} has blocked me'
			notification = create_notif(current_profile, other_profile, 1, notif_message, "BLK", pk)
			response_data = {'message': 'You were blocked!'}
			# return Response(status=status.HTTP_200_OK)
			return JsonResponse(response_data)
			
		elif req_type == 'unblock':
			current_profile.blocks.remove(other_profile)
			notif_message = f'{current_profile.username} has unblocked me'
			notification = create_notif(current_profile, other_profile, 2, notif_message, "BLK", pk)
			# other_profile.followers.remove(current_profile)
			response_data = {'message': 'You were unblocked!'}
			# return Response(status=status.HTTP_200_OK)
			return JsonResponse(response_data)
			

def create_notif(current_profile, other_profile, code, notif_message, name, pk):
	Notification.objects.create(
		type="private",
		code_name=name,
		code_value=code,
		message=notif_message,
		sender=current_profile,
		receiver=other_profile,
		# link=f"/chatroom/{str(pk)}"
		link=None
	)
	return Notification