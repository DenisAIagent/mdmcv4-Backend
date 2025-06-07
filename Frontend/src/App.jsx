import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  NavLink
} from 'react-router-dom';

import './App.css';
import './assets/styles/global.css';
import './assets/styles/animations.css';

import apiService from './services/api.service';
import { updateMetaTags } from './i18n';

import {
  CircularProgress,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  Divider,
  useTheme,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Simulator from './components/features/Simulator';
import CookieBanner from './components/features/CookieBanner';

import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import About from './components/sections/About';
import Articles from './components/sections/Articles';
import Reviews from './components/sections/Reviews';
import Contact from './components/sections/Contact';
import AllReviews from './components/pages/AllReviews';
import ArtistPage from './pages/public/ArtistPage';
import SmartLinkPage from './pages/public/SmartLinkPage';

import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import ArtistListPage from './pages/admin/artists/ArtistListPage';
import ArtistCreatePage from './pages/admin/artists/ArtistCreatePage';
import ArtistEditPage from './pages/admin/artists/ArtistEditPage';
import SmartlinkListPage from './pages/admin/smartlinks/SmartlinkListPage';
import SmartlinkCreatePage from './pages/admin/smartlinks/SmartlinkCreatePage';
import SmartlinkEditPage from './pages/admin/smartlinks/SmartlinkEditPage';
import LandingPageGenerator from './components/admin/LandingPageGenerator';
import WordPressConnector from './components/admin/WordPressConnector';
import WordPressSync from './components/admin/WordPressSync';
import ReviewManager from './components/admin/ReviewManager';
import CampaignStatsShowcase from './components/landing/common/CampaignStatsShowcase';

const drawerWidth = 240;

const ProtectedRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState({ isLoading: true, isAuthenticated: false, isAdmin: false });
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted) return;
      try {
        const response = await apiService.auth.getMe();
        if (response.success && response.data) {
          setAuthStatus({
            isLoading: false,
            isAuthenticated: true,
            isAdmin: response.data.role === 'admin',
          });
        } else {
          setAuthStatus({ isLoading: false, isAuthenticated: false, isAdmin: false });
        }
      } catch {
        if (isMounted) setAuthStatus({ isLoading: false, isAuthenticated: false, isAdmin: false });
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, [location.key]);

  if (authStatus.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Vérification de l'accès...</Typography>
      </Box>
    );
  }

  if (!authStatus.isAuthenticated || !authStatus.isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await apiService.auth.logout?.();
    } catch {}
    localStorage.clear();
    navigate('/admin/login', { replace: true });
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: 'Artistes', path: '/admin/artists', icon: <PeopleIcon /> },
    { label: 'SmartLinks', path: '/admin/smartlinks', icon: <LinkIcon /> },
    { label: 'Landing Pages', path: '/admin/landing-pages', icon: <DashboardIcon /> },
    { label: 'WordPress', path: '/admin/wordpress', icon: <LinkIcon /> },
    { label: 'Avis Clients', path: '/admin/reviews', icon: <PeopleIcon /> },
    { label: 'Statistiques', path: '/admin/stats', icon: <DashboardIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar><Typography variant="h6">Menu Admin</Typography></Toolbar>
      <Divider />
      <List>
        {menuItems.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            component={NavLink}
            to={path}
            onClick={() => setMobileOpen(false)}
            sx={{
              '&.active': {
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
                '& .MuiListItemIcon-root': { color: '#fff' },
              },
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Panneau d'administration</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Déconnexion</Button>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>{drawer}</Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }} open>{drawer}</Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

const HomePage = ({ openSimulator }) => {
  useEffect(() => { console.log("HomePage rendu"); }, []);
  return (
    <>
      <Header />
      <main>
        <Hero openSimulator={openSimulator} />
        <Services />
        <About />
        <Articles />
        <Reviews />
        <Contact />
      </main>
      <Footer openSimulator={openSimulator} />
      <CookieBanner />
    </>
  );
};

function App() {
  const { t, i18n } = useTranslation();
  const simulatorRef = useRef(null);

  useEffect(() => {
    updateMetaTags(t);
    const lang = i18n.language.split('-')[0];
    document.documentElement.setAttribute('lang', lang);
    const ogLocaleValue = i18n.language.replace('-', '_');
    const ogLocaleElement = document.querySelector('meta[property="og:locale"]');
    if (ogLocaleElement) ogLocaleElement.setAttribute('content', ogLocaleValue);
  }, [t, i18n.language]);

  const openSimulator = () => simulatorRef.current?.openSimulator();

  return (
    <Router>
      <Simulator ref={simulatorRef} />
      <Routes>
        <Route path="/" element={<>
          <Header />
          <main>
            <Hero />
            <Services />
            <About />
            <Articles />
            <Reviews />
            <Contact />
          </main>
          <Footer />
          <CookieBanner />
        </>} />
        <Route path="/all-reviews" element={<AllReviews />} />
        <Route path="/artists/:slug" element={<ArtistPage />} />
        <Route path="/s/:slug" element={<SmartLinkPage />} />
        <Route path="/smartlinks/:artistSlug/:trackSlug" element={<SmartLinkPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminPanel />} />
          <Route path="artists" element={<Outlet />}>
            <Route index element={<ArtistListPage />} />
            <Route path="new" element={<ArtistCreatePage />} />
            <Route path="edit/:slug" element={<ArtistEditPage />} />
          </Route>
          <Route path="smartlinks" element={<Outlet />}>
            <Route index element={<SmartlinkListPage />} />
            <Route path="new" element={<SmartlinkCreatePage />} />
            <Route path="edit/:smartlinkId" element={<SmartlinkEditPage />} />
          </Route>
          <Route path="landing-pages" element={<LandingPageGenerator />} />
          <Route path="wordpress" element={<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}><WordPressConnector /><WordPressSync /></Box>} />
          <Route path="reviews" element={<ReviewManager />} />
          <Route path="stats" element={<CampaignStatsShowcase />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
