import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  CssBaseline,
  CircularProgress,
  Alert
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';

export default function CreateOrganizationForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Создаем экземпляр axios с базовыми настройками
  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });

    useEffect(() => {
        const accessToken = location.state?.access_token || localStorage.getItem('access_token');
        const refreshToken = location.state?.refresh_token || localStorage.getItem('refresh_token');

        if (!accessToken || !refreshToken) {
            navigate('/sign-in', {
                state: {
                    message: 'Требуется авторизация для создания организации'
                }
            });
        } else {
            if (location.state?.access_token) {
                localStorage.setItem('access_token', location.state.access_token);
                localStorage.setItem('refresh_token', location.state.refresh_token);
            }
        }

        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location, navigate]);



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Название организации обязательно');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/core/organizations/', { name });

      navigate('/dashboard', {
        state: {
          message: `Организация "${response.data.name}" успешно создана!`
        }
      });
    } catch (err) {
      if (err.response?.status === 401) {

        navigate('/sign-in', {
          state: {
            message: 'Сессия истекла. Пожалуйста, войдите снова.'
          }
        });
        return;
      }

      // Обработка других ошибок
      const errorData = err.response?.data;
      if (errorData?.name) {
        setError(errorData.name[0]);
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        setError('Ошибка при создании организации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper elevation={3} sx={{
        mt: 8,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 2,
        boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.2)'
      }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <BusinessIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Создание организации
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Название организации"
            name="name"
            autoComplete="organization"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Создать организацию'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}