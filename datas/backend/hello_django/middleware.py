import json
from django.http import JsonResponse

class CustomUnauthorizedMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code == 401:
            # Vérifier si la réponse contient des informations sur 'token_not_valid'
            try:
                response_data = json.loads(response.content)
                if 'code' in response_data and response_data['code'] == 'token_not_valid':
                    error_message = response_data['code']
                    return JsonResponse({'error': 'Custom message: Unauthorized access', 'code': error_message}, status=241)
            except json.JSONDecodeError:
                # Si la réponse n'est pas au format JSON
                pass
            
            return response
        return response