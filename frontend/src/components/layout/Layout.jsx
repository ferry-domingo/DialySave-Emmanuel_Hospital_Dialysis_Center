import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useOnlineUsersStore } from "../../store/onlineUsersStore";
import { connectSocket, disconnectSocket } from "../../lib/socket";
import { useMessageStore } from "../../store/messageStore";
import { usePatientStore } from "../../store/patientStore";
import { useDoctorStore } from "../../store/doctorStore";
import { useDialysisSessionStore } from "../../store/dialysisSessionStore";
import { useDashboardStore } from "../../store/dashboardStore";
import { useMonitoringStore } from "../../store/monitoringStore";
import { useAdmissionReportStore } from "../../store/admissionReportStore";
import { useUserStore } from "../../store/userStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useAnnouncementStore } from "../../store/announcementStore";
import { useDoctorPortalStore } from "../../store/doctorPortalStore";
import { normalizeRole, ROLES } from "../../utils/roles";

const Layout = () => {
  const { loadUser, token, user } = useAuthStore();
  const setOnlineUserIds = useOnlineUsersStore((state) => state.setOnlineUserIds);
  const fetchConversations = useMessageStore((state) => state.fetchConversations);
  const receiveMessage = useMessageStore((state) => state.receiveMessage);
  const replaceMessage = useMessageStore((state) => state.replaceMessage);
  const applyReadReceipt = useMessageStore((state) => state.applyReadReceipt);
  const clearMessages = useMessageStore((state) => state.clear);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const receiveNotification = useNotificationStore((state) => state.receiveNotification);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = connectSocket(token);
    const refreshTimers = new Map();
    const refreshResource = (resource, detail = {}) => {
      const role = normalizeRole(useAuthStore.getState().user?.role);
      const path = window.location.pathname;
      const canUseOperationalPages = [ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER].includes(role);
      const onDashboard = path === "/dashboard";
      const actions = {
        patients: () => canUseOperationalPages && ["/patients", "/monitoring", "/alerts", "/dashboard"].includes(path) && usePatientStore.getState().fetchPatients({ silent: true }),
        doctors: () => canUseOperationalPages && path === "/doctors" && useDoctorStore.getState().fetchDoctors({ silent: true }),
        "dialysis-sessions": () => canUseOperationalPages && path === "/sessions" && useDialysisSessionStore.getState().fetchSessions({ silent: true }),
        dashboard: () => {
          if (!onDashboard) return;
          const store = useDashboardStore.getState();
          if (role === ROLES.ADMIN) return store.fetchAdminSummary(store.lastAdminFilters, { silent: true });
          if (canUseOperationalPages) return store.fetchSummary(store.lastSummaryDate, { silent: true });
        },
        monitoring: () => {
          if (!canUseOperationalPages || path !== "/monitoring") return;
          const store = useMonitoringStore.getState();
          if (store.activePatientId) store.fetchMonitoring(store.activePatientId, store.activeYear, { silent: true });
        },
        "admission-report": () => canUseOperationalPages && path === "/admission-report" && useAdmissionReportStore.getState().fetchReports({ silent: true }),
        users: () => {
          const currentUser = useAuthStore.getState().user;
          const currentId = currentUser?.id || currentUser?._id;
          if (detail.entityId && String(detail.entityId) === String(currentId)) useAuthStore.getState().loadUser({ silent: true });
          if (role === ROLES.ADMIN && path === "/users") useUserStore.getState().fetchUsers({ silent: true });
        },
        "online-directory": () => path === "/messages" && Promise.all([useUserStore.getState().fetchOnlineDirectory(), useMessageStore.getState().fetchContacts()]),
        "activity-logs": () => {
          if (role !== ROLES.ADMIN || path !== "/activity-logs") return;
          const store = useUserStore.getState();
          store.fetchActivityLogs(store.activeLogsArchived, { silent: true });
        },
        notifications: () => useNotificationStore.getState().fetchNotifications({ silent: true }),
        announcements: () => role === ROLES.ADMIN && path === "/admin-announcements" && useAnnouncementStore.getState().fetchAnnouncements({ silent: true }),
        "doctor-portal": () => role === ROLES.DOCTOR && path.startsWith("/doctor-") && useDoctorPortalStore.getState().fetchPortal({ silent: true }).catch(() => { }),
        profile: () => {
          const currentUser = useAuthStore.getState().user;
          const currentId = currentUser?.id || currentUser?._id;
          if (!detail.actorUserId || String(detail.actorUserId) === String(currentId)) useAuthStore.getState().loadUser({ silent: true });
        },
      };
      actions[resource]?.();
      window.dispatchEvent(new CustomEvent("dialysave:data-changed", { detail: { ...detail, resource } }));
    };
    const queueRefresh = (resource, detail) => {
      clearTimeout(refreshTimers.get(resource));
      refreshTimers.set(resource, window.setTimeout(() => {
        refreshTimers.delete(resource);
        refreshResource(resource, detail);
      }, 150));
    };
    const handleDataChange = (payload = {}) => {
      const resources = payload.resources || (payload.resource ? [payload.resource] : []);
      [...new Set(resources)].forEach((resource) => queueRefresh(resource, payload));
    };
    let hasConnected = false;
    const syncMessages = () => {
      socket.emit("online-users:request");
      fetchConversations();
      const activeConversationId = useMessageStore.getState().activeConversationId;
      if (activeConversationId) useMessageStore.getState().loadMessages(activeConversationId);
      if (hasConnected) {
        const path = window.location.pathname;
        const routeResources = path === "/dashboard" ? ["dashboard", "patients", "notifications"]
          : path === "/monitoring" ? ["monitoring", "patients", "notifications"]
            : path === "/sessions" ? ["dialysis-sessions", "notifications"]
              : path === "/patients" ? ["patients", "notifications"]
                : path === "/doctors" ? ["doctors", "notifications"]
                  : path === "/admission-report" ? ["admission-report", "notifications"]
                    : path === "/users" ? ["users", "notifications"]
                      : path === "/activity-logs" ? ["activity-logs", "notifications"]
                        : path === "/admin-announcements" ? ["announcements", "notifications"]
                          : path.startsWith("/doctor-") ? ["doctor-portal", "notifications"]
                            : ["notifications"];
        routeResources.forEach((resource) => queueRefresh(resource, { reconnect: true }));
      }
      hasConnected = true;
    };
    const handleNewMessage = (message) => receiveMessage(message, false);
    socket.on("online-users", setOnlineUserIds);
    socket.emit("online-users:request");
    socket.on("connect", syncMessages);
    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", replaceMessage);
    socket.on("message:unsent", replaceMessage);
    socket.on("message:read", applyReadReceipt);
    socket.on("conversation:new", syncMessages);
    socket.on("notification:new", receiveNotification);
    socket.on("data:changed", handleDataChange);
    fetchConversations();
    fetchNotifications();

    return () => {
      socket.off("online-users", setOnlineUserIds);
      socket.off("connect", syncMessages);
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", replaceMessage);
      socket.off("message:unsent", replaceMessage);
      socket.off("message:read", applyReadReceipt);
      socket.off("conversation:new", syncMessages);
      socket.off("notification:new", receiveNotification);
      socket.off("data:changed", handleDataChange);
      refreshTimers.forEach((timer) => clearTimeout(timer));
      disconnectSocket();
      clearMessages();
    };
  }, [token, setOnlineUserIds, fetchConversations, receiveMessage, replaceMessage, applyReadReceipt, clearMessages, fetchNotifications, receiveNotification]);

  if (token && !user) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f7f5] text-sm text-slate-400">Loading workspace...</div>;
  }

  const isAdmin = normalizeRole(user?.role) === ROLES.ADMIN;

  return (
    <div className={`app-shell min-h-screen w-full max-w-full overflow-x-hidden bg-[#e4f0ea] md:flex ${isAdmin ? "admin-dashboard-shell" : ""}`}>
      <Sidebar />

      <div className="app-main-column min-w-0 max-w-full flex-1 md:h-screen md:overflow-hidden">
        <main className="app-main-content min-h-[calc(100vh-4.5rem)] w-full min-w-0 max-w-full px-2 py-2 sm:px-3 md:h-full md:overflow-y-auto md:px-3 md:py-2 lg:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
