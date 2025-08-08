import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { api } from '../../../services/api';

export const InvitePage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/invite/', { email });
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке приглашения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Пригласить пользователя
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Приглашение успешно отправлено!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email пользователя"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleInvite}
        disabled={loading || !email}
      >
        {loading ? <CircularProgress size={24} /> : 'Отправить приглашение'}
      </Button>
    </Box>
  );
};