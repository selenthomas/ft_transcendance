from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from websockets.models import Notification
from .models import Match
from .views_match import createMatch
# Create your views here.
from users.models import User, Invitation  # Import your User model
User = get_user_model()

#@method_decorator(csrf_protect, name='dispatch')
class Subscribe(APIView):
	# Cette méthode gère les requêtes POST
	def post(self, request):
		current_user = request.user
		# Try to find another user with status WAITING_PLAYER
		waiting_user = User.objects.filter(status=User.USER_STATUS['WAITING_PLAYER']).exclude(id=current_user.id).first()
		if waiting_user:
			# Create a match object
			player1 = ['username', current_user, current_user.username]
			player2 = ['username', waiting_user, waiting_user.username]
			match = createMatch(current_user, None, player1, player2)
			# Retrieve match ID
			match_id = match.match_id
			waiting_user.SetStatus(User.USER_STATUS['ONLINE'])
			notif_message = f'We found a random opponant for you: {current_user.username}'
			Notification.objects.create(
				type="private",
				code_name="PLY",
				code_value=1,
				message=notif_message,
				sender=current_user,
				receiver=waiting_user,
				link=f"/play/{match_id}"
			)
			#send a notification waiting_user 
			# Response with match ID
			return JsonResponse({'message': 'Match created!', 'match_id': match_id}, status=201)

		else:
			# Change the status of the current user to WAITING_PLAYER
			current_user.SetStatus(User.USER_STATUS['WAITING_PLAYER'])
			current_user.save()
			response_content = 'No waiting player found, status updated to WAITING_PLAYER.'
			return JsonResponse({'message': response_content}, status=200)

#@method_decorator(csrf_protect, name='dispatch')
class Unsubscribe(APIView):
	# Cette méthode gère les requêtes POST
	def post(self, request):
		current_user = request.user
		current_user.SetStatus(User.USER_STATUS['ONLINE'])
		current_user.save()
		response_content = 'Unscubscribed from waiting list'
		return HttpResponse(response_content, status = 200)


#@method_decorator(csrf_protect, name='dispatch')
class Invite(APIView):
	permission_classes = [IsAuthenticated]
	def post(self, request, req_type, id):
		user = request.user  # L'utilisateur faisant la demande
		user_invited = get_object_or_404(User, id=id)  # L'utilisateur cible de l'action

		if req_type == 'send':
			# Vérifier si l'utilisateur a déjà envoyé une invitation
			if hasattr(user, 'sent_invitation'):
				return HttpResponse("You have already sent an invitation.", status=400)
			try:
				invitation = Invitation.objects.create(sender=user, receiver=user_invited)

				notif_message = f'{user.username} has invited me to play'
				Notification.objects.create(
					type="private",
					code_name="INV",
					code_value=1,
					message=notif_message,
					sender=user,
					receiver=user_invited,
					link=f"/home"
				)
				return HttpResponse("Invitation sent!")
			except IntegrityError:
				return HttpResponse("An error occurred while sending the invitation.", status=500)

		elif req_type == 'cancel':
			# Vérifier si l'utilisateur a effectivement envoyé une invitation
			invitation = get_object_or_404(Invitation, sender=user, receiver=user_invited)
			invitation.delete()
			notif_message = f'{user.username} has cancelled her/his invitation'
			Notification.objects.create(
				type="private",
				code_name="INV",
				code_value=2,
				message=notif_message,
				sender=user,
				receiver=user_invited,
				link=None
			)
			return HttpResponse("invitation cancelled", status=200)

		elif req_type == 'deny':
			# Vérifier si l'utilisateur cible a reçu une invitation
			invitation_sender = user_invited
			invitation = get_object_or_404(Invitation, sender=invitation_sender, receiver=user)
			# Envoyer une notification / invitation refusee
			##### TO DO
			notif_message = f'{user.username} has rejected {invitation_sender.username} invitation'
			Notification.objects.create(
				type="private",
				code_name="INV",
				code_value=3,
				message=notif_message,
				sender=user,
				receiver=invitation_sender,
				link=None
			)
			invitation.delete()
			return HttpResponse("deny invitation!")

		elif req_type == 'accept':
			# Vérifier si l'utilisateur cible a reçu une invitation
			invitation_sender = user_invited
			
			# Vérifier le statut du demandeur (s'il est en ligne, annuler la demande)
			# S'il est en ligne, cela signifie que l'invitation a été annulée

			invitation = get_object_or_404(Invitation, sender=invitation_sender, receiver=user)
			
			player1 = ['username', user, user.username]
			player2 = ['username', invitation_sender, invitation_sender.username]
			match = createMatch(user, None, player1, player2)
			match_id = match.match_id

			# Envoyer une notification / invitation acceptee + match_id + lien
			notif_message = f'{user.username} has accepted {invitation_sender.username} invitation'
			Notification.objects.create(
				type="private",
				code_name="INV",
				code_value=4,
				message=notif_message,
				sender=user,
				receiver=invitation_sender,
				link=f"/play/{str(match_id)}"
			)

			# supprimer l'invitation 
			invitation.delete()
			response_data = {'message': 'Invitation accepted !', 'match_id': match_id}
			return JsonResponse(response_data)

		return HttpResponse("Invalid request type.", status=400)