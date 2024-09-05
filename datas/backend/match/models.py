from django.db import models
from django.conf import settings
from users.models import User  # Importer le modèle User depuis l'application users
from django.utils import timezone
import uuid

# Create your models here.
class Tournament(models.Model):
    tournament_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=0)
    # Ajoutez d'autres champs nécessaires pour le modèle Tournament
    
    def __str__(self):
        return self.name
class MatchPoints(models.Model):
    #match = models.ForeignKey(Match, null=True, blank=True, on_delete=models.CASCADE)
    #match = models.ForeignKey(Match, null=True, blank=True, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    points = models.IntegerField()
    my_user_id = models.TextField(max_length=100, blank=True)
    alias = models.TextField(max_length=50, blank=True)

class Match(models.Model):
    match_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(Tournament, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    status = models.IntegerField(default=0)
    #users = models.ManyToManyField(User)
    match_points = models.ManyToManyField(MatchPoints)

    @property
    def players_set(self):
        return self.match_points.all()



    #def __str__(self):
        #return f'MatchPoints {self.pk} - Match {self.match.pk} - User {self.user.username}'