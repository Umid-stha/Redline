# Error Sentinel

# Redline — Build Checklist

A step-by-step to-do list. Work top to bottom — each section builds on the previous one.
Check off as you go.

---

## Phase 1 — Project Setup

- [ ] Create a new Django project: `django-admin startproject redline`
- [ ] Create core apps: `events`, `alerts`, `projects`, `accounts`
- [ ] Set up a virtual environment, install initial dependencies:
      `django`, `djangorestframework`, `celery`, `redis`, `django-celery-results`,
      `django-celery-beat`, `psycopg2-binary`, `python-dotenv`
- [ ] Configure `settings.py`:
  - [ ] Move `SECRET_KEY`, `DEBUG`, `DATABASE_URL` to `.env`, load with `python-dotenv`
  - [ ] Configure PostgreSQL as the database (not SQLite)
  - [ ] Add installed apps: `rest_framework`, `django_celery_results`, `django_celery_beat`
- [ ] Set up `celery.py` in the project root, wire it into `__init__.py`
- [ ] Configure Celery broker (Redis) and result backend in `settings.py`
- [ ] Write a `docker-compose.yml` with three services: `db` (Postgres), `redis`, `web` (Django)
- [ ] Confirm `python manage.py runserver` works cleanly
- [ ] Initialise a git repo, add `.gitignore` (exclude `.env`, `__pycache__`, `*.pyc`)

---

## Phase 2 — Authentication

- [ ] Install `djangorestframework-simplejwt` and `rest_framework_simplejwt.token_blacklist`
- [ ] Add `token_blacklist` to `INSTALLED_APPS`, run migrations
- [ ] Create a `accounts` app with a custom `User` model extending `AbstractUser`
  - [ ] Set `AUTH_USER_MODEL = 'accounts.User'` before the first migration
- [ ] Write custom auth views (do NOT use simplejwt defaults):
  - [ ] `RegisterView` — email + password, returns access token, sets refresh cookie
  - [ ] `LoginView` — validates credentials, issues tokens same way
  - [ ] `RefreshView` — reads `httpOnly` cookie, returns new access token
  - [ ] `LogoutView` — blacklists refresh token, clears cookie
- [ ] Configure simplejwt settings in `settings.py`:
  - [ ] `ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)`
  - [ ] `REFRESH_TOKEN_LIFETIME = timedelta(days=7)`
  - [ ] `ROTATE_REFRESH_TOKENS = True`
  - [ ] `BLACKLIST_AFTER_ROTATION = True`
- [ ] Set `CORS_ALLOW_CREDENTIALS = True` and `CORS_ALLOWED_ORIGINS` for React dev server
- [ ] Write tests for all four auth endpoints (`pytest-django`, `factory_boy`)
- [ ] Wire auth URLs into `urls.py`
- [ ] Manually test with HTTPie or Postman: register → login → access protected route → refresh → logout

---

## Phase 3 — Projects & API Key Auth

- [ ] Create a `Project` model in the `projects` app:
  - [ ] `name`, `owner` (FK to User), `api_key` (auto-generated UUID), `created_at`
- [ ] Auto-generate `api_key` on `Project.save()` using `uuid.uuid4()`
- [ ] Write a custom DRF authentication class `APIKeyAuthentication`:
  - [ ] Reads `X-API-Key` header from the request
  - [ ] Looks up the `Project` by that key
  - [ ] Sets `request.project` so every downstream view has it
  - [ ] Returns `(None, project)` — not a user auth, a project auth
- [ ] Add `APIKeyAuthentication` to DRF `DEFAULT_AUTHENTICATION_CLASSES`
- [ ] Write a `ProjectViewSet` (CRUD) — only the owner can see/edit their projects
- [ ] Write tests for project creation and API key lookup
- [ ] Confirm: hitting any endpoint with a wrong API key returns 403

---

## Phase 4 — Event Ingestion

- [ ] Create the `Event` model in the `events` app:
  - [ ] `id` (UUID primary key)
  - [ ] `project` (FK to Project)
  - [ ] `issue` (FK to Issue — nullable for now, filled in after fingerprinting)
  - [ ] `exception_type` (CharField)
  - [ ] `exception_message` (TextField)
  - [ ] `stack_trace` (JSONField — store as structured list of frames)
  - [ ] `environment` (CharField — "production", "staging", "development")
  - [ ] `level` (CharField — "error", "warning", "info")
  - [ ] `timestamp` (DateTimeField — when the error happened in the source app)
  - [ ] `received_at` (DateTimeField — auto_now_add, when Redline received it)
  - [ ] `metadata` (JSONField — request URL, user_id, any extra context)
- [ ] Write the ingest endpoint `POST /api/ingest/`:
  - [ ] Authenticated by `APIKeyAuthentication` (API key in header, not JWT)
  - [ ] Validate the incoming payload with a DRF serializer
  - [ ] Do NOT process synchronously — push raw payload to Celery task immediately
  - [ ] Return `202 Accepted` right away (not 200 — the work is async)
- [ ] Write tests: valid payload returns 202, invalid payload returns 400, wrong key returns 403
- [ ] Test with a manual POST to confirm 202 comes back and the task appears in Redis

---

## Phase 5 — Fingerprinting & Issue Grouping

- [ ] Create the `Issue` model in the `events` app:
  - [ ] `id` (UUID primary key)
  - [ ] `project` (FK to Project)
  - [ ] `fingerprint` (CharField, unique per project)
  - [ ] `title` (CharField — e.g. `ZeroDivisionError: division by zero`)
  - [ ] `culprit` (CharField — e.g. `myapp/views.py in divide_view`)
  - [ ] `total_occurrences` (PositiveIntegerField, default=1)
  - [ ] `first_seen` (DateTimeField)
  - [ ] `last_seen` (DateTimeField)
  - [ ] `status` (CharField — "open", "resolved", "ignored")
  - [ ] `level` (CharField — mirrors Event level)
  - [ ] `environment` (CharField)
- [ ] Write the fingerprinting logic in `events/fingerprint.py`:
  - [ ] Normalize stack frames: strip full file paths to filename only, keep function name, drop line numbers
  - [ ] Hash: `sha256(exception_type + top 5 normalized frames)` → hex digest
  - [ ] Handle edge cases: no stack trace → hash just the exception type + message
- [ ] Write the Celery task `process_event`:
  - [ ] Deserialize the raw ingest payload
  - [ ] Compute fingerprint
  - [ ] `get_or_create` the Issue by `(project, fingerprint)`
  - [ ] If created: set `first_seen`, `last_seen`, `total_occurrences=1`
  - [ ] If existing: update `last_seen`, increment `total_occurrences` with `F()` expression (avoids race conditions)
  - [ ] Create the `Event` linked to the Issue
  - [ ] Add retry logic: `@shared_task(autoretry_for=(Exception,), max_retries=3, countdown=5)`
- [ ] Write unit tests for the fingerprinting function:
  - [ ] Same error, different line numbers → same fingerprint
  - [ ] Same error, different function → different fingerprint
  - [ ] No stack trace → doesn't crash
- [ ] Write integration test: POST to ingest → run Celery task eagerly → confirm Issue and Event exist in DB

---

## Phase 6 — Dashboard API Endpoints

- [ ] Issues list `GET /api/projects/{id}/issues/`:
  - [ ] Filter by project (scoped to request.user's projects)
  - [ ] Support query params: `?status=open`, `?environment=production`, `?level=error`
  - [ ] Order by `last_seen` descending by default
  - [ ] Paginate (cursor pagination — better than page numbers for real-time data)
- [ ] Issue detail `GET /api/projects/{id}/issues/{issue_id}/`:
  - [ ] Returns full Issue fields plus last 10 Events
- [ ] Events list `GET /api/projects/{id}/issues/{issue_id}/events/`:
  - [ ] Paginated list of all raw Events for an Issue
  - [ ] Each Event shows full stack trace, metadata, timestamp
- [ ] Issue update `PATCH /api/projects/{id}/issues/{issue_id}/`:
  - [ ] Allow status change: open → resolved, open → ignored
- [ ] Stats endpoint `GET /api/projects/{id}/stats/`:
  - [ ] Total issues count, open vs resolved
  - [ ] Events over time (last 24h, 7d, 30d — grouped by hour/day)
- [ ] Write tests for all endpoints — especially that a user cannot access another project's issues

---

## Phase 7 — Alerting

- [ ] Create the `Alert` model in the `alerts` app:
  - [ ] `project` (FK to Project)
  - [ ] `name` (CharField)
  - [ ] `threshold` (PositiveIntegerField — e.g. 10 occurrences)
  - [ ] `timeframe_minutes` (PositiveIntegerField — e.g. within 5 minutes)
  - [ ] `notification_type` (CharField — "email" for now)
  - [ ] `recipient_email` (EmailField)
  - [ ] `is_active` (BooleanField)
- [ ] Write a Celery Beat periodic task `check_alerts`:
  - [ ] Runs every minute via `crontab()`
  - [ ] For each active Alert, count Events on open Issues in the timeframe
  - [ ] If count >= threshold, trigger notification
  - [ ] Store last-triggered time to avoid spamming (don't re-alert within the same timeframe)
- [ ] Write the email notification task using Django's `send_mail`
- [ ] Configure Celery Beat schedule in `settings.py` under `CELERY_BEAT_SCHEDULE`
- [ ] Write tests for the alert checker — mock the clock so you can simulate a burst of events
- [ ] Manually test: seed 10+ events in 5 minutes, confirm email fires

---

## Phase 8 — Polish & Portfolio Readiness

- [ ] Add structured logging throughout (`logging` module, JSON format in production)
- [ ] Add `django-silk` for local profiling — find any N+1 queries in your list endpoints
- [ ] Fix any N+1s with `select_related` / `prefetch_related`
- [ ] Write a proper `README.md`:
  - [ ] What Redline is (one paragraph)
  - [ ] Architecture diagram (use dbdiagram.io or draw.io)
  - [ ] Local setup instructions (Docker Compose)
  - [ ] API reference (key endpoints, example payloads)
  - [ ] Design decisions section — why fingerprinting works this way, why `F()` for counters
- [ ] Deploy to a free tier (Railway or Render):
  - [ ] Postgres + Redis as add-ons
  - [ ] Celery worker as a separate process
  - [ ] Celery Beat as a separate process
  - [ ] Environment variables configured via platform dashboard
- [ ] Write a minimal Python SDK (`redline-sdk/`) — just a `capture_exception()` function that POSTs to ingest
- [ ] Integrate the SDK into a throwaway test Django app and generate real errors end-to-end
- [ ] Record a short demo (Loom or similar) — great for portfolio and for showing your uncle

---

## Running Order Summary

```
Phase 1 → Setup
Phase 2 → Auth (JWT)
Phase 3 → Projects + API Key
Phase 4 → Ingest endpoint
Phase 5 → Fingerprint + Celery processing   ← core of the system
Phase 6 → Dashboard API
Phase 7 → Alerting
Phase 8 → Polish + Deploy
```

i am building a project for my resume it is a error monitoring platform and i need a frontend

few import notes for you
must have is a login/register modal with github login
users can create projects and generate apikey/manage views for projects

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7d26e83a-70a6-43dd-9907-46b77509e970).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
