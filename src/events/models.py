from django.db import models
from projects.models import Project
import uuid

class IssueStatus(models.TextChoices):
    OPEN = "open", "Open"
    RESOLVED = "resolved", "Resolved"
    IGNORED = "ignored", "Ignored"

class EventLevel(models.TextChoices):
    ERROR = "error", "Error"
    WARNING = "warn", "Warning"
    INFO = "info", "Info"

class EventEnvironment(models.TextChoices):
    PRODUCTION = "prod", "Production"
    STAGING = "staging", "Staging"
    DEVELOPMENT = "dev", "Development"

class Issue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    fingerprint = models.CharField(max_length=240, unique=True)
    title = models.CharField(max_length=120)
    culprit = models.TextField(null=True, blank=True)
    total_occurences = models.PositiveIntegerField(default=1)

    first_seen = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=10, default=IssueStatus.OPEN, choices=IssueStatus.choices)
    environment = models.CharField(max_length=10, default=EventEnvironment.DEVELOPMENT, choices=EventEnvironment.choices)
    level = models.CharField(max_length=10, choices=EventLevel.choices, null=True, blank=True)

    def __str__(self):
        return self.title


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, null=True, blank=True)
    exception_type = models.CharField(max_length=240, null=True, blank=True)
    exception_message= models.TextField(null=True, blank=True)
    stack_trace = models.JSONField(null=True, blank=True)
    environment = models.CharField(max_length=10, default=EventEnvironment.DEVELOPMENT, choices=EventEnvironment.choices)
    level = models.CharField(max_length=10, choices=EventLevel.choices, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    timestamp = models.DateTimeField()
    recieved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Event in {self.project.name}"

