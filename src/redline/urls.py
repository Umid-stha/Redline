from django.contrib import admin
from django.urls import path, include, re_path
from accounts.views import GithubLogin
from allauth.account.views import ConfirmEmailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    re_path(
        "api/auth/registration/account-confirm-email/(?P<key>[-:\w]+)/$",
        ConfirmEmailView.as_view(),
        name="account_confirm_email",
    ),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/github/', GithubLogin.as_view(), name='github_login'),
    path('api/', include('projects.urls')),
    path('api/', include('events.urls')),
]
