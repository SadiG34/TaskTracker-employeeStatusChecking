import React from 'react';
import { Button, Menu, MenuItem, Box, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { api } from '../../../services/api';

const statusOptions = [
  { value: 'online', label: 'Online', color: 'success.main' },
  { value: 'offline', label: 'Offline', color: 'grey.500' },
  { value: 'lunch', label: 'Обед', color: 'warning.main' },
  { value: 'meeting', label: 'Встреча', color: 'info.main' },
  { value: 'vacation', label: 'Отпуск', color: 'secondary.main' },
];

export default function StatusSelector({ currentStatus, onStatusChange }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.post('/api/users/update-status/', { status: newStatus });
      onStatusChange(newStatus);
      handleClose();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const currentStatusData = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[1];

  return (
    <Box>
        <Button
          variant="contained"
          onClick={handleClick}
          startIcon={<CircleIcon sx={{ color: currentStatusData.color, fontSize: 'small' }} />}
          sx={{
            backgroundColor: currentStatusData.color === 'grey.500' ? 'white' : currentStatusData.color,
            color: currentStatusData.color === 'grey.500' ? 'black' : 'white',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <Typography variant="body1">{currentStatusData.label}</Typography>
        </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {statusOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            sx={{ minWidth: 150 }}
          >
            <CircleIcon sx={{ color: option.color, fontSize: 'small', mr: 1 }} />
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}