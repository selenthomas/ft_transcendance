from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse

from .serializers import UserSerializer
from django.contrib.auth import get_user_model, login
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.middleware.csrf import get_token
import os
import json
import requests
from django.middleware.csrf import get_token
import uuid

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def check_user_existence(user_id):
    # Utilisez la méthode exists() pour vérifier si un utilisateur avec cet ID existe
    user_exists = User.objects.filter(id_42=user_id).exists()

    return user_exists

@api_view(['GET', 'POST'])
def login42Callback(request):
	get_token_path = "https://api.intra.42.fr/oauth/token"
	if request.method == 'POST':
		
		# Convertir la chaîne JSON en objet Python
		body_data = json.loads(request.body.decode('utf-8'))
		data = {
			'grant_type': 'authorization_code',
			'client_id': os.environ.get("API42_CLIENT_ID"),
			'client_secret': os.environ.get("API42_SECRET"),
			'code': body_data.get('code'),
			'redirect_uri': os.environ.get("API42_REDIRECT_URI"),
		}

	else:
		return JsonResponse({'error': 'Method not allowed'}, status=405)
	r = requests.post(get_token_path, data=data)
	if r.json().get('error'):
		return  Response(r.json())

	token = r.json()['access_token']
	headers = {"Authorization": "Bearer %s" % token}

	user_response = requests.get("https://api.intra.42.fr/v2/me", headers=headers)
	user_response_json = user_response.json()

	av_1 = user_response_json['image']
	av_2 = av_1['versions']
	avatar_url = av_2['small']

	user_id_42 = user_response_json['id']

	if check_user_existence(user_id_42):
		user = User.objects.get(id_42=user_id_42)

	else:
		user = User.objects.create_user(
			id_42=user_id_42,
			username=user_response_json['login'],
			first_name=user_response_json['first_name'],
			last_name=user_response_json['last_name'],
			email=user_response_json['email'],
			avatar=avatar_url,
		)

	serializer = UserSerializer(user)
	user_info = {}
	token_info = get_tokens_for_user(user)  

	user_info = {
		"refresh": token_info["refresh"],
		"access": token_info["access"],
		"user": serializer.data,
	}
	user = User.objects.get(id_42=user_id_42)
	user.SetStatus(User.USER_STATUS['ONLINE'])
	response = Response(user_info)
	response['X-CSRFToken'] = get_token(request)  # Récupère le jeton CSRF et l'ajoute à l'en-tête de la réponse
	response['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, user-agent, x-csrftoken, x-requested-with'
	response['Access-Control-Expose-Headers'] = 'Set-Cookie, X-CSRFToken'
	response['Access-Control-Allow-Credentials'] = True

	return response