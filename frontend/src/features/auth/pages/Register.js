import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация
        if (!formData.email) {
            setError('Email обязателен');
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Введите корректный email');
            return;
        }

        if (!formData.username.trim()) {
            setError('Имя пользователя обязательно');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        setLoading(true);
        setError('');

    try {
        const response = await axios.post('http://localhost:8000/api/users/auth/register/', {
            token,
            email: formData.email,
            username: formData.username,
            password: formData.password
        });

        // Сохраняем токены
       localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh)

        // ОДИН вызов navigate с небольшой задержкой
        setTimeout(() => {
            navigate('/create-organization', {
                state: {
                    message: 'Регистрация успешна! Теперь создайте организацию.',
                    // Передаем токены в state для надежности
                    access_token: response.data.access,
                    refresh_token: response.data.refresh
                }
            });
        }, 300);


        } catch (error) {
            const backendError = error.response?.data;
            let errorMessage = 'Произошла ошибка при регистрации';

            if (backendError?.email) {
                errorMessage = `Email: ${backendError.email[0]}`;
            } else if (backendError?.username) {
                errorMessage = `Имя пользователя: ${backendError.username[0]}`;
            } else if (backendError?.password) {
                errorMessage = `Пароль: ${backendError.password[0]}`;
            } else if (backendError?.detail) {
                errorMessage = backendError.detail;
            }

            setError(errorMessage);
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
                    <HowToRegIcon />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Завершение регистрации
                </Typography>

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
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <EmailIcon color="action" sx={{ mr: 1 }} />
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Имя пользователя"
                        name="username"
                        autoComplete="username"
                        value={formData.username}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <PersonIcon color="action" sx={{ mr: 1 }} />
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Пароль (минимум 8 символов)"
                        type="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Подтвердите пароль"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}