import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

export const ProjectFilters = ({ filters, onChange }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Статус</InputLabel>
        <Select
          value={filters.status}
          label="Статус"
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <MenuItem value="active">Активные</MenuItem>
          <MenuItem value="completed">Завершенные</MenuItem>
          <MenuItem value="">Все</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};