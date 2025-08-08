import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { api } from '../../../services/api';

export default function RegisterByInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    console.log('Token from URL:', token); // Логирование для отладки

    if (!token) {
      setError('Токен приглашения отсутствует');
      setLoading(false);
      return;
    }

    api.get(`/api/users/validate-invite/?token=${encodeURIComponent(token)}`)
      .then(response => {
        console.log('API Response:', response.data); // Логирование ответа
        if (!response.data.valid) {
          throw new Error(response.data.error || 'Недействительное приглашение');
        }
        setInviteData(response.data);
      })
      .catch(err => {
        console.error('Validation Error:', err);
        setError(err.response?.data?.error || err.message || 'Ошибка проверки приглашения');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inviteData) {
      setError('Данные приглашения не загружены');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);
    api.post('/api/users/register-by-invite/', {
      token: searchParams.get('token'),
      password
    })
      .then(() => {
        navigate('/sign-in', {
          state: { message: 'Регистрация завершена. Теперь вы можете войти.' }
        });
      })
      .catch(err => {
        console.error('Registration Error:', err);
        setError(err.response?.data?.error || err.message || 'Ошибка регистрации');
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxWidth={400} mx="auto" mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!inviteData) {
    return null;
  }

  return (
    <Box maxWidth={400} mx="auto" mt={4} p={3} boxShadow={3} borderRadius={2}>
      <Typography variant="h5" gutterBottom>
        Завершение регистрации
      </Typography>
      <Typography gutterBottom>
        Вас пригласили в организацию: <strong>{inviteData.organization}</strong>
      </Typography>
      <Typography gutterBottom>
        Email: <strong>{inviteData.email}</strong>
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Пароль"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextField
          label="Подтвердите пароль"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Завершить регистрацию'}
        </Button>
      </form>
    </Box>
  );
}