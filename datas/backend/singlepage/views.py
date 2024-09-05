from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.http import JsonResponse


# Create your views here.
def index(request):
    return render(request, "singlepage/index.html")


texts = ["Coucou la section 1",
        "Praesent euismod auctor quam, id congue tellus malesuada vitae. Ut sed lacinia quam. Sed vitae mattis metus, vel gravida ante. Praesent tincidunt nulla non sapien tincidunt, vitae semper diam faucibus. Nulla venenatis tincidunt efficitur. Integer justo nunc, egestas eget dignissim dignissim,  facilisis, dictum nunc ut, tincidunt diam.",
        "coucou le loup"]

def section(request, num):
    if 1 <= num <= 3:
        return HttpResponse(texts[num-1])
    else:
        raise Http404("No such section")


def healthcheck(request):
    # Insérez ici la logique de vérification de l'état de santé de votre application
    return JsonResponse({'status': 'ok'})