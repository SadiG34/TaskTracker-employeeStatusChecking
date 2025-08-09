from rest_framework import serializers
from .models import CustomUser, Invitation
from core.models import Organization


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'status', 'organization', 'organization_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'status': {'read_only': False},
            'organization': {'read_only': False}
        }

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует")
        return value

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Пользователь с таким username уже существует")
        return value

    def create(self, validated_data):
        # Для обычной регистрации (без инвайта)
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=True
        )
        return user


class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже зарегистрирован")
        return value


class RegisterWithInviteSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=False)

    def validate_token(self, value):
        if not Invitation.objects.filter(token=value, is_used=False).exists():
            raise serializers.ValidationError("Недействительный или использованный токен")
        return value


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['status']
        extra_kwargs = {
            'status': {'required': True}
        }

class UserStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'status', 'last_status_change']