from django.db.models import Q
from rest_framework import filters
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from .models import Organization, Project
from .serializers import OrganizationSerializer, ProjectSerializer, ProjectDetailSerializer, ProjectTaskSerializer
from rest_framework.permissions import IsAuthenticated

from users.models import CustomUser

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        organization = serializer.save(admin=self.request.user)
        self.request.user.organization = organization
        self.request.user.save()

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

        return Project.objects.filter(
            organization=user.organization
        ).annotate(
            is_member=Q(members__id=user.id)
        ).prefetch_related('members').order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['retrieve', 'tasks']:
            return ProjectDetailSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
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
        """Получение задач проекта с фильтрацией"""
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

        serializer = ProjectTaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        """Создание задачи в проекте"""
        project = self.get_object()
        if not project.members.filter(id=request.user.id).exists():
            return self._permission_denied()

        serializer = ProjectTaskSerializer(
            data=request.data,
            context={'request': request, 'project': project}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(
            project=project,
            assigned_to=request.user
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        return self.request.user == project.organization.admin

    def _permission_denied(self):
        return Response(
            {"error": "Только администратор организации может выполнять это действие"},
            status=status.HTTP_403_FORBIDDEN
        )
