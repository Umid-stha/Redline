from django.urls import path
from .views import ingest_event_view

urlpatterns = [
    path('ingest/', ingest_event_view, name='ingest-event')
]