import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import StatusSelector from '../../projects/components/StatusSelector';
import { api } from '../../../services/api';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import CircleIcon from '@mui/icons-material/Circle';

export default function Dashboard() {
  const [userStatus, setUserStatus] = useState('offline');
  const [teamStatus, setTeamStatus] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Загрузка данных пользователя и команды
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Загружаем данные текущего пользователя
        const userResponse = await api.get('/api/users/profile/');
        setCurrentUser(userResponse.data);
        setUserStatus(userResponse.data.status);

        // Загружаем статусы команды
        await loadTeamStatus();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    loadUserData();
  }, []);

  const loadTeamStatus = async () => {
    try {
      const response = await api.get('/api/users/team-status/');
      setTeamStatus(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статусов команды:', error);
    }
  };

  const handleStatusChange = (newStatus) => {
    setUserStatus(newStatus);
    // Оптимистичное обновление списка команды
    if (currentUser) {
      setTeamStatus(prev => prev.map(user =>
        user.id === currentUser.id
          ? { ...user, status: newStatus, last_status_change: new Date().toISOString() }
          : user
      ));
    }
  };

  const formatStatusTime = (dateString) => {
    if (!dateString) return 'никогда';
    try {
      return format(parseISO(dateString), 'HH:mm, dd MMMM yyyy', { locale: ru });
    } catch {
      return dateString;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Мой статус</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StatusSelector
            currentStatus={userStatus}
            onStatusChange={handleStatusChange}
          />
          <Typography variant="body2" color="text.secondary">
            Последнее изменение: {currentUser ? formatStatusTime(currentUser.last_status_change) : 'загрузка...'}
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Статусы команды</Typography>
        <List>
          {teamStatus.map((user) => (
            <React.Fragment key={user.id}>
              <ListItem>
                <ListItemText
                  primary={user.username}
                  secondary={
                    <>
                      Статус: {statusOptions.find(o => o.value === user.status)?.label || user.status}
                      <br />
                      Последнее изменение: {formatStatusTime(user.last_status_change)}
                    </>
                  }
                />
                <CircleIcon
                  sx={{
                    color: statusOptions.find(o => o.value === user.status)?.color || 'grey.500',
                    fontSize: 'small'
                  }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

const statusOptions = [
  { value: 'online', label: 'Online', color: 'success.main' },
  { value: 'offline', label: 'Offline', color: 'grey.500' },
  { value: 'lunch', label: 'Обед', color: 'warning.main' },
  { value: 'meeting', label: 'Встреча', color: 'info.main' },
  { value: 'vacation', label: 'Отпуск', color: 'secondary.main' },
];