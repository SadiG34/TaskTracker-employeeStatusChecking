from django.urls import path, include
from .views import OrganizationViewSet, ProjectViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]