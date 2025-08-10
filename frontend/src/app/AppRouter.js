import { Routes, Route } from 'react-router-dom';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';
import { ProjectDetailPage } from '../features/projects/pages/ProjectDetailPage';
import CreateOrganizationForm  from '../features/projects/pages/CreateOrganizationForm';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import Dashboard from '../features/auth/pages/Dashboard';
import RegisterByInvitePage from '../features/auth/pages/RegisterByInvitePage';
import { MainLayout } from '../features/auth/pages/MainLayout';
import { InvitePage } from '../features/auth/pages/InvitePage';
import { UsersPage } from '../features/users/pages/UsersPage';


export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/sign-in" element={<Login />} />
      <Route path="/sign-up" element={<Register />} />
      <Route path="/register-by-invite" element={<RegisterByInvitePage />} />
      <Route path="/create-organization" element={<CreateOrganizationForm />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/invite" element={<InvitePage />} />
      </Route>
    </Routes>
  );
};