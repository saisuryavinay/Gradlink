import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterStudentPage from './pages/auth/RegisterStudentPage';
import RegisterAlumniPage from './pages/auth/RegisterAlumniPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import NotFoundPage from './pages/NotFoundPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import AlumniDirectory from './pages/shared/AlumniDirectory';
import AlumniProfilePage from './pages/shared/AlumniProfilePage';
import MentorshipPage from './pages/student/MentorshipPage';
import PlacementUpdatesPage from './pages/student/PlacementUpdatesPage';
import JobsPage from './pages/student/JobsPage';
import JobDetailPage from './pages/shared/JobDetailPage';
import SavedJobsPage from './pages/student/SavedJobsPage';
import MyApplicationsPage from './pages/student/MyApplicationsPage';
import ExpiredJobsPage from './pages/student/ExpiredJobsPage';
import AIResumePage from './pages/student/AIResumePage';
import StudentProfilePage from './pages/shared/MyProfilePage';
import SettingsPage from './pages/shared/SettingsPage';

// Alumni pages
import AlumniDashboard from './pages/alumni/Dashboard';
import AlumniMentorshipPage from './pages/alumni/MentorshipPage';
import AlumniJobSubmissionsPage from './pages/alumni/JobSubmissionsPage';
import ProfessionalUpdatesAlumniPage from './pages/alumni/ProfessionalUpdatesPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudentsPage from './pages/admin/StudentsPage';
import AdminAlumniPage from './pages/admin/AlumniPage';
import AdminJobApprovalsPage from './pages/admin/JobApprovalsPage';
import AdminPlacementUpdatesPage from './pages/admin/PlacementUpdatesPage';
import AdminOffCampusPage from './pages/admin/OffCampusPage';
import AdminEventsPage from './pages/admin/EventsPage';
import AdminProfessionalUpdatesPage from './pages/admin/ProfessionalUpdatesPage';
import AdminMentorshipPage from './pages/admin/MentorshipPage';
import AdminApplicationsPage from './pages/admin/ApplicationsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminPostJobPage from './pages/admin/PostJobPage';

// Shared pages
import EventsPage from './pages/shared/EventsPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'alumni') return <Navigate to="/dashboard/alumni" replace />;
    return <Navigate to="/dashboard/student" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register/student" element={<PublicRoute><RegisterStudentPage /></PublicRoute>} />
      <Route path="/register/alumni" element={<PublicRoute><RegisterAlumniPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Student Dashboard */}
      <Route path="/dashboard/student" element={
        <ProtectedRoute roles={['student']}>
          <DashboardLayout role="student" />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="discover-alumni" element={<AlumniDirectory />} />
        <Route path="discover-alumni/:id" element={<AlumniProfilePage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="placement-updates" element={<PlacementUpdatesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="jobs/placement" element={<JobsPage category="placement" title="Placement Drives" />} />
        <Route path="jobs/off-campus" element={<JobsPage category="off-campus" title="Off-Campus Jobs" />} />
        <Route path="jobs/alumni-posted" element={<JobsPage category="alumni-posted" title="Alumni Job Postings" />} />
        <Route path="jobs/saved" element={<SavedJobsPage />} />
        <Route path="jobs/expired" element={<ExpiredJobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="applications" element={<MyApplicationsPage />} />
        <Route path="ai-resume" element={<AIResumePage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Alumni Dashboard */}
      <Route path="/dashboard/alumni" element={
        <ProtectedRoute roles={['alumni']}>
          <DashboardLayout role="alumni" />
        </ProtectedRoute>
      }>
        <Route index element={<AlumniDashboard />} />
        <Route path="discover-alumni" element={<AlumniDirectory />} />
        <Route path="discover-alumni/:id" element={<AlumniProfilePage />} />
        <Route path="mentorship" element={<AlumniMentorshipPage />} />
        <Route path="job-submissions" element={<AlumniJobSubmissionsPage />} />
        <Route path="professional-updates" element={<ProfessionalUpdatesAlumniPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="alumni" element={<AdminAlumniPage />} />
        <Route path="jobs/approvals" element={<AdminJobApprovalsPage />} />
        <Route path="jobs/post" element={<AdminPostJobPage />} />
        <Route path="jobs/placement" element={<AdminPlacementUpdatesPage />} />
        <Route path="jobs/off-campus" element={<AdminOffCampusPage />} />
        <Route path="jobs/:id" element={<JobDetailPage adminView />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="professional-updates" element={<AdminProfessionalUpdatesPage />} />
        <Route path="mentorship" element={<AdminMentorshipPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
