from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from .models import Project

class APIKeyAuthentication(BaseAuthentication):
    """
    Set project api key to request from http header.
    """
    def authenticate(self, request):
        request.project=None
        api_key = request.headers.get("X-API-Key")
        if api_key is None:
            message = "API key is absent from header."
            raise exceptions.AuthenticationFailed(message)
        project_obj = Project.objects.filter(api_key=api_key)
        if project_obj is None:
            message = "Project with this API key doesn't exist."
            raise exceptions.AuthenticationFailed(message)
        if not project_obj.active:
            message = "Project with this API key is inactive."
            raise exceptions.AuthenticationFailed(message)
        api_key = project_obj.api_key
        request.project = api_key
        return None, api_key