from django.urls import path
# from . import views
from rest_framework.urlpatterns import format_suffix_patterns
from match.views_invite import Subscribe, Unsubscribe, Invite
from match.views_match import MatchList, MatchHistory, CreateLocalMatch
from match.views_tournament import TournamentView
import uuid

urlpatterns = [
    path('create/', CreateLocalMatch.as_view(),name='subscribe'),
    path('subscribe/', Subscribe.as_view(),name='subscribe'),
    path('unsubscribe/', Unsubscribe.as_view(),name='subscribe'),
    path('list/<str:req_type>/', MatchList.as_view(),name='invite'),
    path('invite/<str:req_type>/<uuid:id>/', Invite.as_view(),name='invite'),
    path('tournament/<str:req_type>/', TournamentView.as_view(), name='tournament'),
    path('history/<uuid:id>/', MatchHistory.as_view(), name='history'),

]

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json', 'html'])