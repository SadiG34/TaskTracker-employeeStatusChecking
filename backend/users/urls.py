from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet,
    RegisterView,
    InviteEmployeeView,
    ValidateInviteView,
    RegisterByInviteView,
    ChangeStatusView,
    StatusUpdateView,
    TeamStatusView,
    UserProfileView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('status/', ChangeStatusView.as_view(), name='change_status'),
    path('invite/', InviteEmployeeView.as_view(), name='invite'),
    path('validate-invite/', ValidateInviteView.as_view(), name='validate-invite'),
    path('register-by-invite/', RegisterByInviteView.as_view(), name='register-by-invite'),
    path('team-status/', TeamStatusView.as_view(), name='team-status'),
    path('update-status/', StatusUpdateView.as_view(), name='update-status'),
    path('organization/<int:org_id>/',
         UserViewSet.as_view({'get': 'organization_users'}),
         name='organization-users'),
    path('', include(router.urls)),
]