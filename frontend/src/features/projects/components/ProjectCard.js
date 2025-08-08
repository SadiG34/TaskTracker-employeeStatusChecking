import { Card, CardContent, CardActions, Button, Typography, Chip } from '@mui/material';
import { Link } from 'react-router-dom';

export const ProjectCard = ({ project }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5">
          {project.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
        <Chip
          label={project.status === 'active' ? 'Активный' : 'Завершен'}
          color={project.status === 'active' ? 'success' : 'default'}
          size="small"
        />
      </CardContent>
      <CardActions>
        <Button
          size="small"
          component={Link}
          to={`/projects/${project.id}`}
        >
          Открыть
        </Button>
        <Typography variant="caption" sx={{ ml: 'auto' }}>
          Участников: {project.members?.length || 0}
        </Typography>
      </CardActions>
    </Card>
  );
};