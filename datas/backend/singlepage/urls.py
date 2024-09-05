from django.urls import path
from . import views
from .views import healthcheck

urlpatterns = [
    path("", views.index, name='index'),
    path('healthcheck/', healthcheck, name='healthcheck'),
    path("sections/<int:num>", views.section, name='section'),
]