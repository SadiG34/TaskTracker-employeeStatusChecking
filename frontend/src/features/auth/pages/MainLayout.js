import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  CssBaseline,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  useTheme,
  Chip,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
  '&:hover': {
    textDecoration: 'none',
  },
  '&:visited': {
    color: 'inherit',
  },
}));

const drawerWidth = 240;

export const MainLayout = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    organization: 'Загрузка...',
    username: '',
    status: '',
    email: '',
  });
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!localStorage.getItem('access_token');

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Проекты', icon: <WorkIcon />, path: '/projects' },
    { text: 'Пользователи', icon: <PeopleIcon />, path: '/users' },
    { text: 'Пригласить', icon: <GroupAddIcon />, path: '/invite' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/users/auth/logout/',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/sign-in', {
        state: { message: 'Вы успешно вышли из системы' },
      });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        navigate('/sign-in', {
          state: {
            from: location.pathname,
            message: 'Требуется авторизация',
          },
        });
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/users/profile/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        setUserData({
          organization: response.data.organization || 'Без организации',
          username: response.data.username,
          status: response.data.status,
          email: response.data.email,
        });
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        if (error.response?.status === 401) {
          handleLogout();
        } else {
          setAuthError('Не удалось загрузить данные профиля');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, location]);

  const drawer = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          height: 64,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="subtitle1" noWrap>
          {userData.organization}
        </Typography>
        <IconButton
          onClick={handleDesktopDrawerToggle}
          color="inherit"
          size="small"
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={StyledLink}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              '&.active': {
                bgcolor: theme.palette.action.selected,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              px: 3,
              py: 1.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: location.pathname === item.path ? 'medium' : 'normal',
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          m: 1,
          borderRadius: 2,
          bgcolor: theme.palette.grey[100],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              bgcolor: theme.palette.primary.main,
            }}
          >
            {userData.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {userData.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userData.email}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Chip
            label={userData.status}
            size="small"
            sx={{
              bgcolor: theme.palette.success.light,
              color: theme.palette.success.dark,
            }}
          />
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.error.main,
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Доступ запрещен. Пожалуйста, войдите в систему.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${desktopOpen ? drawerWidth : 0}px)` },
          ml: { sm: `${desktopOpen ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(desktopOpen && {
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            marginLeft: { sm: `${drawerWidth}px` },
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDesktopDrawerToggle}
            sx={{
              mr: 2,
              display: { xs: desktopOpen ? 'none' : 'block', sm: desktopOpen ? 'none' : 'block' },
            }}
          >
            {desktopOpen ? <MenuIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Панель управления'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: desktopOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transform: desktopOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
              transition: theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              borderRight: 'none',
              boxShadow: theme.shadows[1],
            },
          }}
          open={desktopOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            xs: '100%',
            sm: `calc(100% - ${desktopOpen ? drawerWidth : 0}px)`,
          },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        {authError && <Alert severity="error" sx={{ mb: 2 }}>{authError}</Alert>}
        <Outlet />
      </Box>
    </Box>
  );
};