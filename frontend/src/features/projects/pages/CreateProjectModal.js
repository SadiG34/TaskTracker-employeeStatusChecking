import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1
};

export const CreateProjectModal = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/core/projects/', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      setFormData({ name: '', description: '', status: 'active' });
    },
    onError: (error) => {
      console.error('Ошибка создания проекта:', error);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" gutterBottom>
          Новый проект
        </Typography>
        {mutation.isError && (
          <Typography color="error" sx={{ mb: 2 }}>
            Ошибка: {mutation.error.message}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              required
              label="Название"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              multiline
              rows={3}
              label="Описание"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
            />
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Статус"
                onChange={handleChange}
              >
                <MenuItem value="active">Активный</MenuItem>
                <MenuItem value="completed">Завершенный</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};