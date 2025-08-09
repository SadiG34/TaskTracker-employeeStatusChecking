from django.db import models
from django.db.models import Q, Case, When, Value, BooleanField
from rest_framework import filters, viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import Organization, Project
from .serializers import (
    OrganizationSerializer,
    ProjectSerializer,
    ProjectDetailSerializer,
    ProjectTaskSerializer,
    ProjectTaskCreateSerializer,
)
from users.models import CustomUser
from tasks.models import Task

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return the user's organization (if set) or organizations where they are an admin
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return Organization.objects.filter(
                Q(id=user.organization.id) | Q(admins=user)
            ).distinct()
        return Organization.objects.filter(admins=user)

    def perform_create(self, serializer):
        organization = serializer.save()
        organization.admins.add(self.request.user)
        self.request.user.organization = organization
        self.request.user.save()

    @action(detail=True, methods=['post', 'delete'])
    def admins(self, request, pk=None):
        organization = self.get_object()
        if not self._check_admin_access(organization):
            return self._permission_denied()
        if request.method == 'POST':
            return self._add_admin(organization, request.data)
        return self._remove_admin(organization, request.data)

    def _add_admin(self, organization, data):
        email = data.get('email')
        if not email:
            return Response(
                {"error": "Укажите email администратора"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = CustomUser.objects.get(
                email=email,
                organization=organization
            )
            organization.admins.add(user)
            return Response(
                {"status": f"{user.email} добавлен как администратор"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Пользователь не найден в организации"},
                status=status.HTTP_404_NOT_FOUND
            )

    def _remove_admin(self, organization, data):
        user_id = data.get('user_id')
        if not user_id:
            return Response(
                {"error": "Укажите ID администратора"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = organization.admins.get(id=user_id)
            if organization.admins.count() <= 1:
                return Response(
                    {"error": "Нельзя удалить последнего администратора"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            organization.admins.remove(user)
            return Response(
                {"status": f"{user.email} удалён из администраторов"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Администратор не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

    def _check_admin_access(self, organization):
        return self.request.user in organization.admins.all()

    def _permission_denied(self):
        return Response(
            {"error": "Только администратор организации может выполнять это действие"},
            status=status.HTTP_403_FORBIDDEN
        )


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact', 'in'],
        'created_at': ['gte', 'lte'],
        'members': ['exact']
    }
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'deadline']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'organization') or not user.organization:
            return Project.objects.none()

        # Include projects where the user is a member or the organization admin
        return (
            Project.objects.filter(
                Q(organization=user.organization) &
                (Q(members=user) | Q(organization__admins=user))
            )
            .prefetch_related(
                models.Prefetch('members', queryset=user.__class__.objects.distinct())
            )
            .distinct()
            .order_by('-created_at')
        )

    def get_object(self):
        queryset = self.get_queryset()
        pk = self.kwargs.get('pk')
        obj = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        if self.action in ['retrieve', 'tasks']:
            return ProjectDetailSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        if not self.request.user.organization:
            raise serializers.ValidationError("У пользователя нет организации")
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if not self._check_admin_access(project):
            return self._permission_denied()
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post', 'delete'])
    def members(self, request, pk=None):
        project = self.get_object()
        if not self._check_admin_access(project):
            return self._permission_denied()
        if request.method == 'POST':
            return self._add_member(project, request.data)
        return self._remove_member(project, request.data)

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = Task.objects.filter(
            project=project,
            project__members=request.user
        ).select_related('assigned_to')

        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        priority_filter = request.query_params.get('priority')
        if priority_filter:
            tasks = tasks.filter(priority=priority_filter)

        serializer = ProjectTaskSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        project = self.get_object()
        if not project.members.filter(id=request.user.id).exists():
            return self._permission_denied()

        write_serializer = ProjectTaskCreateSerializer(
            data=request.data,
            context={'request': request, 'project': project}
        )
        write_serializer.is_valid(raise_exception=True)
        task = write_serializer.save(project=project)
        read_serializer = ProjectTaskSerializer(task, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def _add_member(self, project, data):
        email = data.get('email')
        if not email:
            return Response(
                {"error": "Укажите email участника"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = CustomUser.objects.get(
                email=email,
                organization=project.organization
            )
            project.members.add(user)
            return Response(
                {"status": f"{user.email} добавлен в проект"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Пользователь не найден в организации"},
                status=status.HTTP_404_NOT_FOUND
            )

    def _remove_member(self, project, data):
        user_id = data.get('user_id')
        if not user_id:
            return Response(
                {"error": "Укажите ID пользователя"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = project.members.get(id=user_id)
            project.members.remove(user)
            return Response(
                {"status": f"{user.email} удалён из проекта"},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Участник не найден в проекте"},
                status=status.HTTP_404_NOT_FOUND
            )

    def _check_admin_access(self, project):
        return self.request.user in project.organization.admins.all()

    def _permission_denied(self):
        return Response(
            {"error": "Только администратор организации может выполнять это действие"},
            status=status.HTTP_403_FORBIDDEN
        )