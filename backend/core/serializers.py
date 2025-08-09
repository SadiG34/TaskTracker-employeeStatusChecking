from django.utils import timezone
from rest_framework import serializers
from .models import Organization, Project
from users.models import CustomUser
from tasks.models import Task
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    admins = serializers.SerializerMethodField()
    current_user = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'admins', 'current_user']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False}
        }

    def get_admins(self, obj):
        return UserSerializer(obj.admins.all(), many=True).data

    def get_current_user(self, obj):
        request = self.context.get('request')
        return UserSerializer(request.user).data if request else None


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
        request = self.context.get('request')
        return request.user in obj.organization.admins.all() if request and obj.organization else False

    def validate_deadline(self, value):
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
            request
            and (
                request.user == obj.assigned_to
                or (obj.project and obj.project.organization and request.user in obj.project.organization.admins.all())
            )
        ) or False


class ProjectTaskCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.none())

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'deadline', 'status', 'assigned_to']
        read_only_fields = ['id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        project = self.context.get('project')
        if project is not None:
            self.fields['assigned_to'].queryset = project.members.all()

    def validate_assigned_to(self, user):
        project = self.context.get('project')
        if project is None:
            raise serializers.ValidationError("Проект не найден в контексте")
        if not project.members.filter(id=user.id).exists():
            raise serializers.ValidationError("Исполнитель должен быть участником проекта")
        return user