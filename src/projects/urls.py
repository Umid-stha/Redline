from rest_framework import routers
from .views import ProjectViewset

router = routers.SimpleRouter()
router.register(r'projects', ProjectViewset, basename='project')
urlpatterns = router.urls