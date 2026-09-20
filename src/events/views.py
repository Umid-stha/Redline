from django.shortcuts import render
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from projects.authentication import APIKeyAuthentication

@authentication_classes([APIKeyAuthentication])
@permission_classes([IsAuthenticated])
@api_view(['POST'])
def ingest_event_view(request):
    pass
