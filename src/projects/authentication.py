from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from .models import Project

class APIKeyAuthentication(BaseAuthentication):
    """
    Set project api key to request from http header.
    """
    def authenticate(self, request):
        request.project = None
        api_key = request.headers.get("X-API-Key")
        if api_key is None:
            message = "API key is absent from header."
            raise exceptions.AuthenticationFailed(message)
        try:
            project_obj = Project.objects.get(api_key=api_key)
        except Project.DoesNotExist:
            message = "Project with this API key doesn't exist."
            raise exceptions.AuthenticationFailed(message)
        except Exception:
            message = "Invalid UUID provided"
            raise exceptions.AuthenticationFailed(message)

        if not project_obj.active:
            message = "Project with this API key is inactive."
            raise exceptions.AuthenticationFailed(message)

        request.project = project_obj
        return None, project_obj