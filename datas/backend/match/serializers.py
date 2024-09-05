from django.contrib.auth import get_user_model
from rest_framework.settings import api_settings
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.validators import MinLengthValidator
from match.models import Tournament, Match, MatchPoints
from websockets.models import Message
from django.core.exceptions import ObjectDoesNotExist
User = get_user_model() # Get reference to the model


class MatchPointsSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(source='user', read_only=True)

    class Meta:
        model = MatchPoints
        fields = ['user_id', 'points', 'alias']

class MatchSerializer(serializers.ModelSerializer):
    match_points = MatchPointsSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = ['match_id', 'status', 'tournament', 'created_at', 'match_points']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['match_points'] = MatchPointsSerializer(instance.match_points.all(), many=True).data
        return representation

class TournamentSerializer(serializers.ModelSerializer):
    matches = MatchSerializer(many=True, read_only=True, source='match_set')
    unique_aliases = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = ['tournament_id', 'name', 'status', 'user', 'created_at', 'matches', 'unique_aliases']
        read_only_fields = ['tournament_id', 'created_at']

    def get_unique_aliases(self, obj):
        # Étape 1 : Récupérer tous les matchs associés à ce tournoi
        matches = Match.objects.filter(tournament=obj)
        
        # Étape 2 : Récupérer tous les MatchPoints associés à ces matchs
        match_points = MatchPoints.objects.filter(match__in=matches)
        
        # Étape 3 : Récupérer les alias uniques
        unique_aliases = match_points.values_list('alias', flat=True).distinct()
        
        return list(unique_aliases)