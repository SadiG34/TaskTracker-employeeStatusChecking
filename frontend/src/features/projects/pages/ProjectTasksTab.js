import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { api } from '../../../services/api';
import { CreateTaskModal } from '../../tasks/CreateTaskModal';

export const ProjectTasksTab = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: organizations, isLoading: isOrgLoading, error: orgError } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/api/core/organizations/').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/api/core/projects/${projectId}/`).then(res => res.data),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/api/tasks/?project=${projectId}`).then(res => res.data),
    enabled: !!projectId
  });

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  const isAdmin = organizations?.some(org =>
    org.admins.some(admin => admin.id === org.current_user?.id)
  ) || false;

  if (isOrgLoading || isProjectLoading) return <CircularProgress />;
  if (orgError) return <Alert severity="error">Ошибка загрузки организации: {orgError.message}</Alert>;
  if (projectError) return <Alert severity="error">Ошибка: {projectError.message}</Alert>;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  return (
    <>
      {isAdmin && (
        <Button
          variant="contained"
          onClick={() => setIsTaskModalOpen(true)}
          sx={{ mb: 3 }}
        >
          Новая задача
        </Button>
      )}

      <List>
        {tasks?.length === 0 ? (
          <Typography>Нет доступных задач.</Typography>
        ) : (
          tasks?.map((task) => (
            <ListItem key={task.id} divider>
              <ListItemText
                primary={task.title}
                secondary={task.description}
              />
              <Chip
                label={task.priority}
                color={
                  task.priority === 'high' ? 'error' :
                  task.priority === 'medium' ? 'warning' : 'default'
                }
              />
            </ListItem>
          ))
        )}
      </List>

      {isAdmin && (
        <CreateTaskModal
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={projectId}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
};