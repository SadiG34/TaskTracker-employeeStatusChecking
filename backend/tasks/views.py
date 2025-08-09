from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.none()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project')
        if project_id:
            if self.request.user in self.request.user.organization.admins.all():
                return Task.objects.filter(project_id=project_id)
            return Task.objects.filter(
                project_id=project_id,
                project__members=self.request.user
            )
        return Task.objects.none()

    def perform_create(self, serializer):
        if self.request.user not in self.request.user.organization.admins.all():
            return Response(
                {"error": "Only an organization admin can create tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Automatically assign the task to the creator
        serializer.save(assigned_to=self.request.user)