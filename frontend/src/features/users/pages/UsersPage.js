import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { api } from '../../../services/api';

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { data: organizations, isLoading: isOrgLoading, error: orgError } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/api/core/organizations/').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: users, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ['organization_users'],
    queryFn: async () => {
      const org = organizations?.[0];
      if (!org) throw new Error('No organization found');
      return api.get(`/api/users/organization/${org.id}/`).then((res) => res.data);
    },
    enabled: !!organizations?.length,
    staleTime: 5 * 60 * 1000,
  });

  const addAdminMutation = useMutation({
    mutationFn: ({ orgId, email }) =>
      api.post(`/api/core/organizations/${orgId}/admins/`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      queryClient.invalidateQueries(['organization_users']);
      setError(null);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Ошибка при добавлении администратора');
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: ({ orgId, userId }) =>
      api.delete(`/api/core/organizations/${orgId}/admins/`, { data: { user_id: userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations']);
      queryClient.invalidateQueries(['organization_users']);
      setError(null);
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Ошибка при удалении администратора');
    },
  });

  const handleAddAdmin = (user) => {
    const org = organizations?.[0];
    if (!org) return;
    addAdminMutation.mutate({ orgId: org.id, email: user.email });
  };

  const handleRemoveAdmin = (userId) => {
    const org = organizations?.[0];
    if (!org) return;
    removeAdminMutation.mutate({ orgId: org.id, userId });
  };

  const isAdmin = organizations?.some(org =>
    org.admins.some(admin => admin.id === org.current_user?.id)
  ) || false;

  if (isOrgLoading || isUsersLoading) return <CircularProgress />;
  if (orgError) return <Alert severity="error">Ошибка загрузки организации: {orgError.message}</Alert>;
  if (usersError) return <Alert severity="error">Ошибка загрузки пользователей: {usersError.message}</Alert>;
  if (!organizations?.length) return <Alert severity="error">Вы не состоите в какой-либо организации</Alert>;

  const organization = organizations[0];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
         {organization.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <List>
        {users?.length > 0 ? (
          users.map((user) => {
            const isUserAdmin = organization.admins.some(admin => admin.id === user.id);
            return (
              <ListItem key={user.id} divider>
                <ListItemText
                  primary={user.username}
                  secondary={isUserAdmin ? 'Администратор' : 'Участник'}
                />
                {isAdmin && user.id !== organization.current_user?.id && (
                  <ListItemSecondaryAction>
                    {isUserAdmin ? (
                      <IconButton
                        edge="end"
                        aria-label="remove admin"
                        onClick={() => handleRemoveAdmin(user.id)}
                        disabled={removeAdminMutation.isLoading}
                        title="Удалить роль администратора"
                      >
                        <PersonRemoveIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        edge="end"
                        aria-label="add admin"
                        onClick={() => handleAddAdmin(user)}
                        disabled={addAdminMutation.isLoading}
                        title="Назначить администратором"
                      >
                        <PersonAddIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })
        ) : (
          <Typography color="text.secondary">Нет пользователей в организации</Typography>
        )}
      </List>
    </Box>
  );
};