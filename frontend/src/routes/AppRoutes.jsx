import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "../components/layout/Layout";
import PublicLayout from "../components/public/PublicLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleRoute from "../components/layout/RoleRoute";
import { ROLES } from "../utils/roles";

import HomeDashboard from "../pages/HomeDashboard";
import LoginPage from "../pages/LoginPage";
import DoctorPage from "../pages/doctors/DoctorPage";
import DialysisSessionPage from "../pages/dialysis/DialysisSessionPage";
import PatientPage from "../pages/patients/PatientPage";
import MonitoringPage from "../pages/monitoring/MonitoringPage";
import AdmissionReportPage from "../pages/admissionReport/admissionReportPage";
import PatientPortalPage from "../pages/patients/PatientPortalPage";
import PatientSessionsPage from "../pages/patients/PatientSessionsPage";
import UsersPage from "../pages/users/UsersPage";
import ActivityLogsPage from "../pages/activityLogs/ActivityLogsPage";
import SettingsPage from "../pages/settings/SettingsPage";
import MessagesPage from "../pages/messages/MessagesPage";
import AlertsPage from "../pages/alerts/AlertsPage";
import AnnouncementsPage from "../pages/announcements/AnnouncementsPage";
import DoctorDashboardPage from "../pages/doctors/DoctorDashboardPage";
import DoctorPatientsPage from "../pages/doctors/DoctorPatientsPage";
import DoctorSessionsPage from "../pages/doctors/DoctorSessionsPage";
import LandingPage from "../pages/public/LandingPage";
import { AboutPage, ContactPage, GalleryPage, ServicesPage, TechnologyPage } from "../pages/public/PublicInfoPages";
import PublicAnnouncementsPage from "../pages/public/PublicAnnouncementsPage";
import TechnologyGalleryPage from "../pages/technology/TechnologyGalleryPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/facilities" element={<TechnologyPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/announcements" element={<PublicAnnouncementsPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><HomeDashboard /></RoleRoute>} />
          <Route path="/patients" element={<RoleRoute allowedRoles={[ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><PatientPage /></RoleRoute>} />
          <Route path="/patient-portal" element={<RoleRoute allowedRoles={[ROLES.PATIENT]}><PatientPortalPage /></RoleRoute>} />
          <Route path="/patient-sessions" element={<RoleRoute allowedRoles={[ROLES.PATIENT]}><PatientSessionsPage /></RoleRoute>} />
          <Route path="/doctor-dashboard" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><DoctorDashboardPage /></RoleRoute>} />
          <Route path="/doctor-patients" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><DoctorPatientsPage /></RoleRoute>} />
          <Route path="/doctor-sessions" element={<RoleRoute allowedRoles={[ROLES.DOCTOR]}><DoctorSessionsPage /></RoleRoute>} />
          <Route path="/doctors" element={<RoleRoute allowedRoles={[ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><DoctorPage /></RoleRoute>} />
          <Route path="/sessions" element={<RoleRoute allowedRoles={[ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><DialysisSessionPage /></RoleRoute>} />
          <Route path="/monitoring" element={<RoleRoute allowedRoles={[ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><MonitoringPage /></RoleRoute>} />
          <Route path="/admission-report" element={<RoleRoute allowedRoles={[ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER]}><AdmissionReportPage /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><UsersPage /></RoleRoute>} />
          <Route path="/activity-logs" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><ActivityLogsPage /></RoleRoute>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/alerts" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER, ROLES.PATIENT, ROLES.DOCTOR]}><AlertsPage /></RoleRoute>} />
          <Route path="/admin-announcements" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><AnnouncementsPage /></RoleRoute>} />
          <Route path="/admin-technology" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><TechnologyGalleryPage /></RoleRoute>} />
          <Route path="/admin-contact" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><Navigate to="/settings#contact-information" replace /></RoleRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
