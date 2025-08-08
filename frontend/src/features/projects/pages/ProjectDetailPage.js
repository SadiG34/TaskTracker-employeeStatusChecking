import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button
} from '@mui/material';
import { api } from '../../../services/api';
import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectMembersTab } from './ProjectMembersTab';
import { ProjectChatTab } from './ProjectChatTab';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/api/core/projects/${id}/`).then(res => res.data),
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Ошибка: {error.message}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {project?.name}
      </Typography>

      <Typography color="text.secondary" paragraph>
        {project?.description}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Задачи" />
          <Tab label="Участники" />
          <Tab label="Чат" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <ProjectTasksTab projectId={id} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ProjectMembersTab projectId={id} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ProjectChatTab projectId={id} />
      </TabPanel>
    </Container>
  );
};