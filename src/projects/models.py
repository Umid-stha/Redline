from django.db import models
from django.contrib.auth import get_user_model
from helpers import generate_uuid
import uuid

User = get_user_model()

class ProjectManager(models.Manager):
    def of_user(self, user):
        return self.filter(owner=user)

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    api_key = models.UUIDField()
    active = models.BooleanField(default=True)

    objects = ProjectManager()

    created = models.DateTimeField(auto_now=True, null=True, blank=True)
    updated = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = generate_uuid.generate_uuid()
        super().save(*args, **kwargs)

    def regenerate_api_key(self):
        self.api_key = generate_uuid.generate_uuid()
        self.save()