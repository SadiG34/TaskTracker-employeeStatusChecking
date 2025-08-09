from django.utils import timezone
from rest_framework import serializers
from .models import Organization, Project
from users.models import CustomUser
from tasks.models import Task

from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    admin = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'admin']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

    def get_admin(self, obj):
        return UserSerializer(obj.admin).data if obj.admin else None

class ProjectSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status',
            'deadline', 'created_at', 'is_admin'
        ]
        read_only_fields = ['created_at']

    def get_is_admin(self, obj):
        """Проверка, является ли пользователь админом организации"""
        request = self.context.get('request')
        return request.user == obj.organization.admin if request and obj.organization else False

    def validate_deadline(self, value):
        """Проверка дедлайна"""
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Дедлайн не может быть в прошлом")
        return value

class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'status']

class ProjectDetailSerializer(ProjectSerializer):
    organization = OrganizationSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)
    current_user = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['organization', 'members', 'current_user']

    def get_current_user(self, obj):
        request = self.context.get('request')
        return UserSerializer(request.user).data if request else None

class ProjectTaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.StringRelatedField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority',
            'deadline', 'status', 'assigned_to', 'can_edit'
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return (
            request.user == obj.assigned_to or
            request.user == obj.project.organization.admin
        ) if request and obj.project.organization else False