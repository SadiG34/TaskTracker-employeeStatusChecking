from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
from urllib.parse import quote, unquote
from rest_framework.permissions import IsAuthenticated
import logging

from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, Invitation
from .serializers import UserSerializer, StatusSerializer
from core.models import Organization

logger = logging.getLogger(__name__)


def generate_invite_token():
    """Генерация безопасного токена только из букв и цифр"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(40))


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = CustomUser.objects.create_user(
            username=request.data['username'],
            email=request.data['email'],
            password=request.data['password'],
            is_active=True
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)


class InviteEmployeeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not hasattr(user, 'organization') or user.organization is None:
            return Response(
                {"error": "Пользователь не принадлежит к организации"},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.organization.admin != user:
            return Response(
                {"error": "Только админ организации может приглашать сотрудников"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "Email обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "Пользователь с таким email уже существует"},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = generate_invite_token()
        invitation = Invitation.objects.create(
            email=email,
            organization=request.user.organization,
            created_by=request.user,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(days=7)# дается 7 дней на активацию через инвайт
        )

        try:
            safe_token = quote(token)
            invitation_link = f"{settings.FRONTEND_URL}/register-by-invite?token={safe_token}"

            logger.info(f"Created invite for {email}, token: {token}")
            logger.info(f"Generated link: {invitation_link}")

            send_mail(
                subject=f"Приглашение в {user.organization.name}",
                message=f"""Вас пригласили присоединиться к {user.organization.name}.

Для регистрации перейдите по ссылке:
{invitation_link}

Ссылка действительна 7 дней.""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=f"""<h3>Приглашение в {user.organization.name}</h3>
                <p>Для завершения регистрации нажмите кнопку:</p>
                <a href="{invitation_link}" 
                   style="background: #4e73df; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   Завершить регистрацию
                </a>
                <p><small>Ссылка действительна 7 дней</small></p>"""
            )

            return Response(
                {"status": "Приглашение отправлено"},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            invitation.delete()
            logger.error(f"Error sending email: {str(e)}")
            return Response(
                {"error": f"Ошибка отправки email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ValidateInviteView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        raw_token = request.GET.get('token', '')
        if not raw_token:
            return Response({"error": "Токен обязателен"}, status=400)

        try:
            token = unquote(raw_token)
            token = ''.join(c for c in token if c.isalnum())

            logger.info(f"Validating token: {token} (original: {raw_token})")

            # Поиск по началу токена для большей надежности
            invite = Invitation.objects.filter(token__startswith=token[:10], is_used=False).first()

            if not invite:
                logger.warning(f"No invite found for token: {token}")
                return Response({"valid": False, "reason": "not_found"}, status=400)

            if invite.token != token:
                logger.warning(f"Token mismatch: DB={invite.token} != URL={token}")
                return Response({"valid": False, "reason": "token_mismatch"}, status=400)

            if invite.expires_at < timezone.now():
                logger.warning(f"Invite expired: {invite.expires_at}")
                return Response({"error": "Срок действия приглашения истёк"}, status=400)

            logger.info(f"Valid invite found for {invite.email}")
            return Response({
                "email": invite.email,
                "organization": invite.organization.name,
                "expires_at": invite.expires_at,
                "valid": True
            })

        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            return Response({"valid": False, "reason": "server_error"}, status=400)


class RegisterByInviteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')

        if not token:
            return Response(
                {"error": "Токен обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password or len(password) < 8:
            return Response(
                {"error": "Пароль должен содержать минимум 8 символов"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Очистка токена
            clean_token = ''.join(c for c in unquote(token) if c.isalnum())
            invite = Invitation.objects.filter(token__startswith=clean_token[:10], is_used=False).first()

            if not invite:
                return Response(
                    {"error": "Недействительное или использованное приглашение"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if invite.token != clean_token:
                return Response(
                    {"error": "Несовпадение токена"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if CustomUser.objects.filter(email=invite.email).exists():
                return Response(
                    {"error": "Пользователь с таким email уже зарегистрирован"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = CustomUser.objects.create_user(
                username=invite.email.split('@')[0],
                email=invite.email,
                password=password,
                organization=invite.organization,
                is_active=True
            )

            invite.is_used = True
            invite.save()

            return Response(
                {
                    "status": "Регистрация успешна",
                    "user_id": user.id,
                    "organization": user.organization.name
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {"error": "Ошибка регистрации"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangeStatusView(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class StatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.status = request.data.get('status')
        request.user.last_status_change = timezone.now()
        request.user.save()
        return Response({
            'status': 'updated',
            'new_status': request.user.status,
            'last_status_change': request.user.last_status_change.isoformat()
        })


class TeamStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'organization') or request.user.organization is None:
            return Response(
                {"error": "User has no organization assigned"},
                status=status.HTTP_400_BAD_REQUEST
            )

        teammates = CustomUser.objects.filter(
            organization=request.user.organization
        ).exclude(id=request.user.id)

        data = [{
            'id': user.id,
            'username': user.username,
            'status': user.status,
            'last_status_change': user.last_status_change.isoformat() if user.last_status_change else None
        } for user in teammates]

        return Response(data)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'status': request.user.status,
            'last_status_change': request.user.last_status_change.isoformat() if request.user.last_status_change else None,
            'organization': request.user.organization.name if request.user.organization else None
        })