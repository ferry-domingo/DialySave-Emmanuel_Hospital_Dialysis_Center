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
    const syncMessages = () => {
      socket.emit("online-users:request");
      fetchConversations();
      const activeConversationId = useMessageStore.getState().activeConversationId;
      if (activeConversationId) useMessageStore.getState().loadMessages(activeConversationId);
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
    const handleDataChange = ({ resource }) => {
      const role = normalizeRole(useAuthStore.getState().user?.role);
      const canUseOperationalPages = [ROLES.PHILHEALTH_OFFICER, ROLES.CASHIER].includes(role);
      const refreshers = {
        patients: () => canUseOperationalPages && usePatientStore.getState().fetchPatients(),
        doctors: () => canUseOperationalPages && useDoctorStore.getState().fetchDoctors(),
        "dialysis-sessions": () => canUseOperationalPages && useDialysisSessionStore.getState().fetchSessions(),
        dashboard: () => {
          if (role === ROLES.ADMIN) return useDashboardStore.getState().fetchAdminSummary();
          if (canUseOperationalPages) return useDashboardStore.getState().fetchSummary();
        },
        monitoring: () => {
          if (!canUseOperationalPages) return;
          const store = useMonitoringStore.getState();
          if (store.activePatientId) store.fetchMonitoring(store.activePatientId);
        },
        "admission-report": () => canUseOperationalPages && useAdmissionReportStore.getState().fetchReports(),
        users: () => {
          useAuthStore.getState().loadUser();
          if (role === ROLES.ADMIN) {
            useUserStore.getState().fetchUsers();
            useDashboardStore.getState().fetchAdminSummary();
          }
        },
        "activity-logs": () => {
          if (role === ROLES.ADMIN) {
            useUserStore.getState().fetchActivityLogs();
            useDashboardStore.getState().fetchAdminSummary();
          }
        },
        notifications: () => useNotificationStore.getState().fetchNotifications(),
      };
      refreshers[resource]?.();
      window.dispatchEvent(new CustomEvent("dialysave:data-changed", { detail: { resource } }));
    };
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
      disconnectSocket();
      clearMessages();
    };
  }, [token, setOnlineUserIds, fetchConversations, receiveMessage, replaceMessage, applyReadReceipt, clearMessages, fetchNotifications, receiveNotification]);

  if (token && !user) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f7f5] text-sm text-slate-400">Loading workspace...</div>;
  }

  const isAdmin = normalizeRole(user?.role) === ROLES.ADMIN;

  return (
    <div className={`app-shell min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f7f5] md:flex ${isAdmin ? "admin-dashboard-shell" : ""}`}>
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
