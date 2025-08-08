from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView, ChangeStatusView, InviteEmployeeView, RegisterByInviteView, \
    TeamStatusView, StatusUpdateView, ValidateInviteView

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

]