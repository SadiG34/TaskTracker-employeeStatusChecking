import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../../services/api';

export const ProjectMembersTab = ({ projectId }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: organizations, isLoading: isOrgLoading, error: orgError } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/api/core/organizations/').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: project, isLoading, error: fetchError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/api/core/projects/${projectId}/`).then(res => res.data),
  });

  const addMemberMutation = useMutation({
    mutationFn: (email) => api.post(`/api/core/projects/${projectId}/members/`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
      setEmail('');
      setError(null);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Ошибка при добавлении участника');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => api.delete(`/api/core/projects/${projectId}/members/`, { data: { user_id: userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
      setError(null);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Ошибка при удалении участника');
    },
  });

  const handleAddMember = () => {
    if (!email) {
      setError('Укажите email участника');
      return;
    }
    addMemberMutation.mutate(email);
  };

  const handleRemoveMember = (userId) => {
    removeMemberMutation.mutate(userId);
  };

  const isAdmin = organizations?.some(org =>
    org.admins.some(admin => admin.id === org.current_user?.id)
  ) || false;

  if (isOrgLoading || isLoading) return <CircularProgress />;
  if (orgError) return <Alert severity="error">Ошибка загрузки организации: {orgError.message}</Alert>;
  if (fetchError) return <Alert severity="error">Ошибка: {fetchError.message}</Alert>;
  if (!project) return <Alert severity="error">Ошибка: Данные проекта не загружены</Alert>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Участники проекта
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <List>
        {project?.members?.length > 0 ? (
          project.members.map((member) => (
            <ListItem key={member.id}>
              <ListItemText
                primary={member.email}
                secondary={isAdmin && member.id === project?.organization?.current_user?.id ? 'Администратор' : 'Участник'}
              />
              {isAdmin && member.id !== project?.organization?.current_user?.id && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removeMemberMutation.isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))
        ) : (
          <Typography color="text.secondary">Нет участников в проекте</Typography>
        )}
      </List>

      {isAdmin && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Добавить участника
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Email участника"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              size="small"
              error={!!error}
              disabled={addMemberMutation.isLoading}
            />
            <Button
              variant="contained"
              onClick={handleAddMember}
              disabled={addMemberMutation.isLoading}
            >
              {addMemberMutation.isLoading ? <CircularProgress size={24} /> : 'Добавить'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};