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

import smtplib
import dns.resolver
from django.core.mail import EmailMessage
from smtplib import SMTPException

User = get_user_model()


def generate_random_digits(n=6):
    return ''.join(random.choices(string.digits, k=n))

def sendEmailWithCode(user_profile, email):

	send_mail(
		'Verification Code',
		f'Your verification code is: {user_profile.otp}',
		'transcendancespies@gmail.com',
		[email],
		fail_silently=False,
	)
	return {"success"}



def validate_email_domain(email_address):
	if '@' not in email_address:
		return False
	domain = email_address.split('@')[1]
	try:
		# Check MX records for the domain
		mx_records = dns.resolver.resolve(domain, 'MX')
		return True
	except dns.resolver.NoAnswer:
		return False
	except dns.resolver.NXDOMAIN:
		return False
	except dns.exception.DNSException:
		return False

def emailCorrespondsToUser(user_profile, email):

	if user_profile.email == email:
		return True

	return False

@api_view(['POST'])
def login2FA(request):
	permission_classes = [AllowAny]
	email = request.data.get('email')

	if not validate_email_domain(email):
		return Response({'detail': 'Domain of email not invalid'}, status=status.HTTP_404_NOT_FOUND)

	username = request.data.get('username')
	password = request.data.get('password')
	user = authenticate(request, username=username, password=password)


	if user is not None:
		verification_code = generate_random_digits()
		# User credentials are valid, proceed with code generation and email sending
		user_profile = User.objects.get(id=user.id)

		if not emailCorrespondsToUser(user_profile, email):
			return Response({'detail': 'Invalid email address.'}, status=status.HTTP_400_BAD_REQUEST )

		# Generate a 6-digit code and set the expiry time to 1 hour from now
		user_profile.otp = verification_code
		user_profile.otp_expiry_time = timezone.now() + timedelta(hours=1)
		user_profile.save()
		# Send the code via email (use Django's send_mail function)

		result = sendEmailWithCode(user_profile, email)
		if "error" in result:
			return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

		return Response({'detail': 'Verification code sent successfully.'}, status=status.HTTP_200_OK)

	return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST )


@api_view(['POST'])
def login2FA_Verify(request):
	email = request.data.get('email')
	username = request.data.get('username')
	password = request.data.get('password')
	otp = request.data.get('verificationcode')
	user = authenticate(request, username=username, password=password)

	if user is not None:
		user_profile = User.objects.get(id=user.id)

		# Check if the verification code is valid and not expired
		if (
			user_profile.otp == otp and
			user_profile.otp_expiry_time is not None and
			user_profile.otp_expiry_time > timezone.now()
		):
			# Verification successful, generate access and refresh tokens
			django_login(request, user)
			# Implement your token generation logic here

			# Use djangorestframework_simplejwt to generate tokens
			refresh = RefreshToken.for_user(user)
			access_token = str(refresh.access_token)

			# Reset verification code and expiry time
			user_profile.otp = ''
			user_profile.otp_expiry_time = None
			user_profile.save()

			return Response({'access_token': access_token, 'refresh_token': str(refresh)}, status=status.HTTP_200_OK)
	return Response({'detail': 'Invalid verification code or credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

