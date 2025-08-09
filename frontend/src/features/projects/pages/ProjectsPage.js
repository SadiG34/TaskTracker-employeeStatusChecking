import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProjectCard } from '../components/ProjectCard';
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { api } from '../../../services/api';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectFilters } from './ProjectFilters';

export const ProjectsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'active' });

  const { data: organizations, isLoading: isOrgLoading, error: orgError } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/api/core/organizations/').then((res) => res.data),
  });

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.get('/api/core/projects/', { params: filters }).then((res) => res.data),
  });

  const isAdmin = organizations?.some(org =>
    org.admins.some(admin => admin.id === org.current_user?.id)
  ) || false;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Проекты организации
      </Typography>

      {isOrgLoading ? (
        <CircularProgress />
      ) : orgError ? (
        <Typography color="error">Ошибка загрузки организации: {orgError.message}</Typography>
      ) : !organizations?.length ? (
        <Typography>Вы не состоите в какой-либо организации.</Typography>
      ) : (
        <>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={() => setIsModalOpen(true)}
              sx={{ mb: 3 }}
            >
              Создать проект
            </Button>
          )}

          <ProjectFilters
            filters={filters}
            onChange={setFilters}
          />

          {isLoading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">Ошибка: {error.message}</Typography>
          ) : (
            <Grid container spacing={3}>
              {projects?.length === 0 ? (
                <Typography>Нет доступных проектов.</Typography>
              ) : (
                projects.map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <ProjectCard project={project} />
                  </Grid>
                ))
              )}
            </Grid>
          )}

          {isAdmin && (
            <CreateProjectModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </>
      )}
    </Container>
  );
};