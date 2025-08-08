from django.utils import timezone
from rest_framework import serializers
from .models import Organization, Project
from users.models import CustomUser

from tasks.models import Task


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name']  # admin не включаем, он устанавливается автоматически
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }


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
        return self.context['request'].user == obj.organization.admin

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
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['members']


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
        )