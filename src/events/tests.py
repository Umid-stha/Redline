from datetime import datetime, timezone
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from events.models import Event
from projects.models import Project

User = get_user_model()


class EventIngestionViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='owner', password='strongpass123')
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.user,
            api_key=str(uuid4()),
            active=True,
        )
        self.url = reverse('ingest-event')

    def valid_payload(self, **overrides):
        payload = {
            'exception_type': 'ValueError',
            'exception_message': 'bad value',
            'stack_trace': [
                {'filename': 'views.py', 'function': 'load_data', 'lineno': 42},
                {'filename': 'utils.py', 'function': 'parse', 'lineno': 7},
            ],
            'environment': 'prod',
            'level': 'error',
            'metadata': {
                'request_url': 'https://example.com/login',
                'user_id': 'abc-123',
            },
            'timestamp': datetime(2024, 3, 20, 15, 42, 30, tzinfo=timezone.utc).isoformat(),
        }
        payload.update(overrides)
        return payload

    def test_valid_payload_returns_202_and_creates_event(self):
        response = self.client.post(
            self.url,
            self.valid_payload(),
            format='json',
            HTTP_X_API_KEY=str(self.project.api_key),
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.json()['message'], 'Accepted event payload')
        # self.assertTrue(Event.objects.filter(project=self.project).exists())

    def test_missing_api_key_returns_403(self):
        response = self.client.post(
            self.url,
            self.valid_payload(),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unknown_api_key_returns_403(self):
        response = self.client.post(
            self.url,
            self.valid_payload(),
            format='json',
            HTTP_X_API_KEY=str(uuid4()),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_project_key_returns_403(self):
        self.project.active = False
        self.project.save(update_fields=['active'])

        response = self.client.post(
            self.url,
            self.valid_payload(),
            format='json',
            HTTP_X_API_KEY=str(self.project.api_key),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_payload_missing_required_fields_returns_400(self):
        response = self.client.post(
            self.url,
            self.valid_payload(metadata={}, timestamp=''),
            format='json',
            HTTP_X_API_KEY=str(self.project.api_key),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        payload = response.json()
        self.assertIn('timestamp', payload)

    def test_invalid_level_choice_returns_400(self):
        response = self.client.post(
            self.url,
            self.valid_payload(level='fatal'),
            format='json',
            HTTP_X_API_KEY=str(self.project.api_key),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('level', response.json())

    def test_missing_timestamp_returns_400(self):
        response = self.client.post(
            self.url,
            self.valid_payload(timestamp=None),
            format='json',
            HTTP_X_API_KEY=str(self.project.api_key),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('timestamp', response.json())
