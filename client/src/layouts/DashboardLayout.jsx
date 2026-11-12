import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Briefcase, BookOpen, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, User, Sun, Moon, Monitor,
  Search, Menu, X, Star, Send, FileText, CheckCircle, Clock,
  Award, Building2, GraduationCap, Zap, Shield, AlertTriangle,
  Megaphone, Eye, BarChart2, FolderOpen, Heart, BookMarked, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/Avatar';
import { notificationsApi } from '../services/api';
import { formatRelativeTime } from '../utils/helpers';

const NAV = {
  student: [
    { label: 'Dashboard', path: '', icon: LayoutDashboard, end: true },
    { label: 'Discover Alumni', path: 'discover-alumni', icon: Users },
    { label: 'Mentorship Requests', path: 'mentorship', icon: Star },
    { label: 'Placement Drives', path: 'jobs/placement', icon: Award },
    { label: 'Off-Campus Jobs', path: 'jobs/off-campus', icon: Briefcase },
    { label: 'Alumni Job Postings', path: 'jobs/alumni-posted', icon: Building2 },
    { label: 'Saved Jobs', path: 'jobs/saved', icon: BookMarked },
    { label: 'My Applications', path: 'applications', icon: FileText },
    { label: 'Expired Jobs', path: 'jobs/expired', icon: Clock },
    { label: 'AI Resume Analyzer', path: 'ai-resume', icon: Zap },
    { label: 'Events', path: 'events', icon: BookOpen },
    { label: 'My Profile', path: 'profile', icon: User },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
  alumni: [
    { label: 'Dashboard', path: '', icon: LayoutDashboard, end: true },
    { label: 'Discover Alumni', path: 'discover-alumni', icon: Users },
    { label: 'Mentorship Requests', path: 'mentorship', icon: Star },
    { label: 'Job Submissions', path: 'job-submissions', icon: Send },
    { label: 'Professional Updates', path: 'professional-updates', icon: TrendingUp },
    { label: 'My Profile', path: 'profile', icon: User },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', path: '', icon: LayoutDashboard, end: true },
    { label: 'Student Management', path: 'students', icon: GraduationCap },
    { label: 'Alumni Management', path: 'alumni', icon: Users },
    { label: 'Job Approvals', path: 'jobs/approvals', icon: CheckCircle },
    { label: 'Post a Job', path: 'jobs/post', icon: Send },
    { label: 'Placement Updates', path: 'jobs/placement', icon: Megaphone },
    { label: 'Off-Campus Jobs', path: 'jobs/off-campus', icon: Briefcase },
    { label: 'Events', path: 'events', icon: BookOpen },
    { label: 'Professional Updates', path: 'professional-updates', icon: TrendingUp },
    { label: 'Mentorship Monitoring', path: 'mentorship', icon: Eye },
    { label: 'Application Management', path: 'applications', icon: FolderOpen },
    { label: 'Reports & Exports', path: 'reports', icon: BarChart2 },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.get({ limit: 10 });
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="btn-ghost relative p-2"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 card shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${!n.read ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                  >
                    <p className={`text-xs font-medium ${!n.read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const icons = { light: Sun, dark: Moon, system: Monitor };
  const Icon = icons[theme] || Monitor;
  return (
    <button id="theme-toggle" onClick={toggleTheme} className="btn-ghost p-2" aria-label="Toggle theme">
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default function DashboardLayout({ role }) {
  const { user, logout, avatarCacheBust } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const basePath = `/dashboard/${role}`;
  const navItems = NAV[role] || [];

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">GradLink</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.end ? basePath : `${basePath}/${item.path}`}
            end={item.end}
            className={({ isActive }) =>
              isActive ? (collapsed ? 'sidebar-link-active justify-center px-2' : 'sidebar-link-active') : (collapsed ? 'sidebar-link justify-center px-2' : 'sidebar-link')
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`sidebar-link w-full ${collapsed ? 'justify-center px-2' : ''}`}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center gap-3 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost p-2 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <ThemeToggle />
          <NotificationBell />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-menu-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Avatar user={user} size="sm" cacheBust={avatarCacheBust} />
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-52 card shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <span className="badge-blue mt-1 capitalize">{user?.role}</span>
                  </div>
                  <div className="p-1">
                    {role !== 'admin' && (
                      <button
                        onClick={() => { navigate(`${basePath}/profile`); setUserMenuOpen(false); }}
                        className="sidebar-link w-full text-left"
                      >
                        <User className="h-4 w-4" /> My Profile
                      </button>
                    )}
                    <button
                      onClick={() => { navigate(`${basePath}/settings`); setUserMenuOpen(false); }}
                      className="sidebar-link w-full text-left"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <div className="my-1 divider" />
                    <button
                      id="logout-button"
                      onClick={handleLogout}
                      className="sidebar-link w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
