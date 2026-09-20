from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(ACCOUNT_EMAIL_VERIFICATION='none')
class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_creates_user(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'newpass123',
            'password2': 'newpass123',
        }
        resp = self.client.post('/api/auth/registration/', data, format='json')
        self.assertIn(resp.status_code, (200, 201))
        self.assertTrue(User.objects.filter(username='newuser').exists())
