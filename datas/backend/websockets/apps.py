from django.apps import AppConfig


class WebsocketsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'websockets'

    # 1. 👇 Add this line for signals
    def ready(self):
        import websockets.signals