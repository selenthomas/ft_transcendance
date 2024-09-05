from django.urls import path

from users.views_login import CustomObtainTokenPairView, CustomTokenRefreshView, GetCSRFTokenView,VerifyTokenView
from users.views_login import UserRegistrationAPIView, GetCSRFTokenView, CustomLogoutView
from users.views_login_42 import login42Callback
from users.views_login2FA import login2FA, login2FA_Verify

from users.views_user import UsersAPIView, FollowUser
from users.views_user import UserDetail


from users.views_chat import ChatMessageHistory

from rest_framework.urlpatterns import format_suffix_patterns
import uuid



urlpatterns = [
    # LOGINS VIEWS
    path('auth/intra_callback/', login42Callback, name="login_42_callback"),
    path('auth/login2FA/', login2FA, name='login2FA'),
    path('auth/verify2FA/', login2FA_Verify, name='login2FA_Verify'),
    path('register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('login/', CustomObtainTokenPairView.as_view(), name='token_obtain_pair'),
	path('login/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
	path('checktoken/', VerifyTokenView.as_view(), name='cjheck_token'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),

    path('refresh_csrftoken/', GetCSRFTokenView.as_view(), name='get_csrf_token'),

    # USERS VIEWS
	path('all/', UsersAPIView.as_view(), name='users-list'),
	path('list/<str:req_type>/', UsersAPIView.as_view(), name='users-list'),
    path('profile/<uuid:id>/', UserDetail.as_view(), name='profile-id'),
    path('<str:req_type>/<uuid:id>/', FollowUser.as_view(), name='follow_user'),


    path('chat/messages/history/<uuid:friend_id>/', ChatMessageHistory.as_view(),name='history'),
]

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json', 'html'])