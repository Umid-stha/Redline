from rest_framework import viewsets, status
from .serializers import ProjectSerializer
from rest_framework.response import Response
from .models import Project
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import action

class ProjectViewset(viewsets.ViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        qs = Project.objects.of_user(request.user)
        serializer = ProjectSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def create(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.owner = request.user
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

    def retrieve(self, request, pk=None):
        if pk is None:
            return Response({'error': 'primary key is missing in url'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obj = Project.objects.of_user(request.user).get(pk=pk)
            serializer = ProjectSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({'error': "Project doesn't exist."}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, pk=None):
        if pk is None:
            return Response({'error': 'primary key is missing in url'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obj = Project.objects.of_user(request.user).get(pk=pk)
            serializer = ProjectSerializer(obj, data=request.data)
            if serializer.is_valid():
                serializer.save(owner=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 
        except Project.DoesNotExist:
            return Response({'error': "Project doesn't exist."}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        if pk is None:
            return Response({'error': 'primary key is missing in url'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obj = Project.objects.of_user(request.user).get(pk=pk)
            serializer = ProjectSerializer(obj, data=request.data)
            if serializer.is_valid():
                serializer.save(partial=True)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 
        except Project.DoesNotExist:
            return Response({'error': "Project doesn't exist."}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, pk=None):
        if pk is None:
            return Response({'error': 'primary key is missing in url'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obj = Project.objects.of_user(request.user).get(pk=pk)
            obj.delete()
            return Response({'message': 'Successfully deleted the project.'}, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({'error': "Project doesn't exist."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def regenerate_api(self, request, pk=None):
        if pk is None:
            return Response({'error': 'primary key is missing in url'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            obj = Project.objects.of_user(request.user).get(pk=pk)
            obj.regenerate_api_key()
            serializer = ProjectSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({'error': "Project doesn't exist."}, status=status.HTTP_404_NOT_FOUND)

