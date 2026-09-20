from rest_framework.decorators import api_view, authentication_classes 
from projects.authentication import APIKeyAuthentication
from rest_framework.response import Response
from rest_framework import status
from .serializer import EventSerializer
from .tasks import process_event

@api_view(['POST'])
@authentication_classes([APIKeyAuthentication])
def ingest_event_view(request):
    project = request.project
    payload = request.data.copy()
    payload['project'] = project.id
    serializer = EventSerializer(data=payload)
    if serializer.is_valid():
        process_event.delay(validated_data=serializer.data)
        return Response({'message': 'Accepted event payload'}, status=status.HTTP_202_ACCEPTED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

