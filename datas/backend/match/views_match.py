from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
from django.db.models import Q, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from websockets.models import Notification
from .models import Match, MatchPoints, Tournament
from .serializers import MatchSerializer,TournamentSerializer

import json
import requests
# Create your views here.
from users.models import User  # Import your User model
User = get_user_model()


class CreateLocalMatch(APIView):
	def get(self, request):
		current_user = request.user
		player1 = ["username", current_user, current_user.username]
		player2 = ["alias", 'Anonymous', 'Anonymous']
		match = createMatch(current_user, None, player1, player2)
		return Response({"match_id": match.match_id}, status=status.HTTP_200_OK)

#@method_decorator(csrf_protect, name='dispatch')
class MatchList(APIView):
	# Cette méthode gère les requêtes POST
	def post(self, request, req_type):
		current_user = request.user

		# Filtrer les matchs dont le statut est 0
		if req_type == 'pending':
			matches = Match.objects.exclude(status=2)
		else:
			matches = Match.objects()

		# Filtrer les matchs pour lesquels l'utilisateur actuel a des points de match
		matches_with_user_points = matches.filter(match_points__user=current_user).distinct()

		# Sérialiser les résultats
		serializer = MatchSerializer(matches_with_user_points, many=True)
		return JsonResponse(serializer.data, safe=False, status=200)

def createMatch(user, tournament, player1, player2):
	user = user
	# recuperer l'objet tournoi
	match = Match.objects.create(tournament=tournament)

	# user en user ou en alias, a checker
	#for player in player1:
	if player1[0] == 'username':
		match_point1 = MatchPoints.objects.create(
			match=match, 
			my_user_id=str(player1[1].id), 
			alias=player1[2], 
			user=player1[1], 
			points=0)
	else:
		match_point1 = MatchPoints.objects.create(match=match, alias=player1[1], points=0)
	

	#for player in player2:
	if player2[0] == 'username':
		match_point2 = MatchPoints.objects.create(
			match=match,
			my_user_id=str(player2[1].id), 
			alias=player2[2], 
			user=player2[1],
			points=0)
	else:
		match_point2 = MatchPoints.objects.create(match=match, alias=player2[1], points=0)
	# renvoyer l'id du match:
	
	match.match_points.add(match_point1)
	match.match_points.add(match_point2)
	return match
# return HttpResponse("Invalid request type.", status=400)

def theWinnerIs(p1, p2, score1, score2):
	if score1 > score2:
		winner = p1
		loser = p2
	elif score1 < score2:
		winner = p2
		loser = p1
	return winner

class MatchHistory(APIView):

	def get(self, request, id):
		current_user = User.objects.get(id=id)
		
		matches = Match.objects.filter(status=2).order_by('created_at')

		# Filtrer les matchs pour lesquels l'utilisateur actuel a des points de match
		matches_with_user_points = matches.filter(match_points__user=current_user).distinct()

		won_matches_count = 0
		lost_matches_count = 0

		for match in matches_with_user_points:
			match_point_1 = match.match_points.get(user=current_user)
			match_point_2 = match.match_points.exclude(user=current_user).first()
			if match_point_1 and match_point_2:
				winner = theWinnerIs(match_point_1.alias, match_point_2.alias, match_point_1.points, match_point_2.points)

				if winner == match_point_1.alias:
					won_matches_count += 1
				elif winner == match_point_2.alias:
					lost_matches_count += 1

		number_of_matches = matches_with_user_points.count()

		serializer = MatchSerializer(matches_with_user_points, many=True)
		matchs = serializer.data
		



		tournaments = Tournament.objects.filter(Q(user=current_user)).filter(status=2).order_by('created_at')
		# tournaments = Tournament.objects.filter(user=request.user).order_by('created_at')
		serializer = TournamentSerializer(tournaments, many=True)
		tournaments_list = serializer.data
	
		stat = {
			'total': number_of_matches,
			'win': won_matches_count,
			'lost': lost_matches_count
		}

		match_stat = {
			"matches_stat": stat,
			"matches_history": matchs,
			"tournaments_history":tournaments_list
		}

		return JsonResponse(match_stat, safe=False, status=200)
