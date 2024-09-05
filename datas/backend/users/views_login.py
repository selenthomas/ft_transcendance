# Create your views here.
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status, authentication
# We import our serializer here
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer
from django.contrib.auth import get_user_model, authenticate, logout, login as django_login
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, OutstandingToken
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view

import random, string
import os
from django.core.files.base import ContentFile
import json
import requests
from django.http import JsonResponse, HttpResponse
from django.views.generic import View
from django.middleware.csrf import get_token, rotate_token
from django.http import Http404
from django.utils.crypto import get_random_string
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404, redirect
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail, BadHeaderError

import smtplib
import dns.resolver
from django.core.mail import EmailMessage
from smtplib import SMTPException

User = get_user_model()

class GetCSRFTokenView(APIView):
	def get(self, request, *args, **kwargs):
		path = settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
		response = JsonResponse({"message": "New Token"}, status=200)
		csrf_token = request.headers.get("api-csrftoken")
		csrf_cookie = request.META.get("CSRF_COOKIE")
		response['X-CSRFToken'] = get_token(request)
		response['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, user-agent, x-csrftoken, x-requested-with'
		response['Access-Control-Expose-Headers'] = 'Set-Cookie, X-CSRFToken'
		response['Access-Control-Allow-Credentials'] = 'true'
		response.status_code = status.HTTP_200_OK
		response.set_cookie(
			key = 'csrftoken', 
			value = get_token(request),
			expires = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
			path= settings.SIMPLE_JWT['AUTH_COOKIE_PATH'],
			secure = settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
			httponly = False,
			samesite = 'Lax'
		  )
		"""
		Check if both alphanumerics(strings) values are differents to prevent 
		a malicious user get the csrf cookie and send it from the ajax.
		"""
		if csrf_token == csrf_cookie:
			rotate_token(request)
		return response

class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request.user.SetStatus(User.USER_STATUS['ONLINE'])
        return Response({'message': 'Token is valid'}, status=200)
		
class CustomTokenRefreshView(TokenRefreshView):
	serializer_class = CustomTokenRefreshSerializer

# @method_decorator(csrf_protect, name='dispatch')
class CustomLogoutView(APIView):
	def post(self, request, *args, **kwargs):
		try:
			if request.user and request.user.is_authenticated:
				request.user.SetStatus(User.USER_STATUS['OFFLINE'])
				logout(request)
				token = RefreshToken(request.data.get('refresh'))
				token.blacklist()
				response = Response({"message": "User logged out successfully."}, status=status.HTTP_200_OK)
				response.delete_cookie('csrftoken')
				return response
			else:
				return Response({"error": "User not authenticated."}, status=status.HTTP_401_UNAUTHORIZED)
		except Exception as e:
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Dans cet exemple, nous avons étendu la vue CustomObtainTokenPairView 
# en surchargeant sa méthode post. Après avoir obtenu le token JWT 
# en appelant la méthode parente super().post(), 
# nous vérifions si la connexion est réussie (indiquée par un code d'état HTTP 200).
# Si c'est le cas, nous ajoutons le cookie CSRF à la réponse en utilisant 
# la fonction get_token(request) pour obtenir le jeton CSRF.
class CustomObtainTokenPairView(TokenObtainPairView):
	permission_classes = [AllowAny]
	serializer_class = CustomTokenObtainPairSerializer
	
	def authenticate_user(self, username, password):
		return authenticate(username=username, password=password)

	def post(self, request, *args, **kwargs):
		# Récupère les données du corps de la requête
		username = request.data.get('username')
		password = request.data.get('password')

		# Authentification de l'utilisateur
		user = self.authenticate_user(username, password)
		if user is not None and user.is_authenticated:
			user.SetStatus(User.USER_STATUS['ONLINE'])
			response = super().post(request, *args, **kwargs)
			if response.status_code == 200:
				# Ajouter le jeton CSRF à la réponse
				csrftoken = get_token(request)
				response['X-CSRFToken'] = csrftoken
				response['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, user-agent, x-csrftoken, x-requested-with'
				response['Access-Control-Expose-Headers'] = 'Set-Cookie, X-CSRFToken'
				response['Access-Control-Allow-Credentials'] = True
				return response
		else:
			return Response({"error": "Sorry, no account was found with the provided username and password"}, status=status.HTTP_401_UNAUTHORIZED)


class UserRegistrationAPIView(APIView):
	# Note: we have to specify the following policy to allow 
	# anonymous users to call this endpoint
	permission_classes = [AllowAny]

	def post(self, request, format=None):
		# Pass user-submitted data to the serializer
		serializer = UserSerializer(data=request.data)

		# Next, we trigger validation with `raise_exceptions=True`
		# which will abort the request and return user-friendly
		# error messages if the validation fails
		serializer.is_valid(raise_exception=True)
		serializer.save()

		# Let's update the response code to 201 to follow the standards
		return Response(serializer.data, status=status.HTTP_201_CREATED)

