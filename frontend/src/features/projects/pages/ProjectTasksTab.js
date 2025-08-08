import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Typography
} from '@mui/material';
import { api } from '../../../services/api';
import { CreateTaskModal } from '../../tasks/CreateTaskModal';

export const ProjectTasksTab = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.get(`/api/tasks/?project=${projectId}`).then(res => res.data),
  });

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setIsTaskModalOpen(true)}
        sx={{ mb: 3 }}
      >
        Новая задача
      </Button>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Ошибка: {error.message}</Typography>
      ) : (
        <List>
          {tasks?.length === 0 ? (
            <Typography>Нет доступных задач.</Typography>
          ) : (
            tasks.map((task) => (
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
      )}

      <CreateTaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
};