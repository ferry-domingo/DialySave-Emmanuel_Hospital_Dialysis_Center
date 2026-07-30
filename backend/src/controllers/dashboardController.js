import DialysisSession from "../models/DialysisSession.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import User from "../models/User.js";
import { normalizeRole, ROLES } from "../utils/roles.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PAYMENT_TYPES = ["PHIC", "PCSO", "CASH", "MISC / V.A.S"];

const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
};

const buildStat = async (Model, periodDays) => {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * DAY_MS);
  const previousStart = new Date(periodStart.getTime() - periodDays * DAY_MS);

  const [total, current, previous] = await Promise.all([
    Model.countDocuments(),
    Model.countDocuments({ createdAt: { $gte: periodStart, $lt: now } }),
    Model.countDocuments({ createdAt: { $gte: previousStart, $lt: periodStart } }),
  ]);

  return {
    total,
    periodDays,
    newInPeriod: current,
    changePercent: percentChange(current, previous),
  };
};

const getMondayOfCurrentWeek = () => {
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday;
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisWeek,
      roleRows,
      activityToday,
      failedLoginsToday,
      alertsThisWeek,
      pendingEmailChanges,
      recentActivity,
      recentSecurityEvents,
      activityRows,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      User.countDocuments({ status: "Inactive" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.countDocuments({ action: { $in: ["LOGIN_FAILED", "LOGIN_BLOCKED"] }, createdAt: { $gte: today } }),
      Notification.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ pendingEmail: { $nin: ["", null] } }),
      ActivityLog.find()
        .populate("actor", "name username role")
        .populate("target", "name username role")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      ActivityLog.find({ action: { $in: ["LOGIN_FAILED", "LOGIN_BLOCKED", "PASSWORD_CHANGE_FAILED"] } })
        .populate("actor", "name username role")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ActivityLog.find({ createdAt: { $gte: sevenDaysAgo } }).select("action createdAt").lean(),
    ]);

    const activityTrend = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(sevenDaysAgo.getTime() + index * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const dayRows = activityRows.filter((row) => row.createdAt >= dayStart && row.createdAt < dayEnd);
      return {
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        activity: dayRows.length,
        security: dayRows.filter((row) => ["LOGIN_FAILED", "LOGIN_BLOCKED", "PASSWORD_CHANGE_FAILED"].includes(row.action)).length,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: { totalUsers, activeUsers, inactiveUsers, newUsersThisWeek, activityToday, failedLoginsToday, alertsThisWeek },
        needsAttention: {
          inactiveAccounts: inactiveUsers,
          pendingEmailChanges,
          securityEventsToday: failedLoginsToday,
          recentSecurityEvents,
        },
        usersByRole: roleRows.map((row) => ({ role: normalizeRole(row._id), count: row.count })),
        activityTrend,
        recentActivity,
        generatedAt: now,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the admin dashboard.",
      error: error.message,
    });
  }
};

export const getCashierDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today.getTime() + DAY_MS);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);
    const cashFilter = { payment_type: "CASH" };

    const [
      cashToday,
      cashThisMonth,
      cashAllTime,
      missingReasons,
      distinctCashPatients,
      recentCashSessions,
      trendRows,
    ] = await Promise.all([
      DialysisSession.countDocuments({ ...cashFilter, createdAt: { $gte: today, $lt: tomorrow } }),
      DialysisSession.countDocuments({ ...cashFilter, createdAt: { $gte: monthStart, $lt: tomorrow } }),
      DialysisSession.countDocuments(cashFilter),
      DialysisSession.countDocuments({
        ...cashFilter,
        $or: [{ reason: /^\s*$/ }, { reason: null }, { reason: { $exists: false } }],
      }),
      DialysisSession.distinct("patient", cashFilter),
      DialysisSession.find(cashFilter)
        .populate("patient", "patient_id first_name last_name")
        .populate("doctor", "first_name last_name")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      DialysisSession.find({
        ...cashFilter,
        createdAt: { $gte: sevenDaysAgo, $lt: tomorrow },
      }).select("createdAt reason").lean(),
    ]);

    const cashTrend = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(sevenDaysAgo.getTime() + index * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const sessions = trendRows.filter((row) => row.createdAt >= dayStart && row.createdAt < dayEnd);
      return {
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        sessions: sessions.length,
        missingReasons: sessions.filter((row) => !row.reason?.trim()).length,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          cashToday,
          cashThisMonth,
          cashAllTime,
          cashPatients: distinctCashPatients.length,
          missingReasons,
        },
        recentCashSessions: recentCashSessions.map((session) => ({
          _id: session._id,
          session_id: session.session_id,
          patient_id: session.patient?.patient_id || "—",
          patient_name: session.patient
            ? `${session.patient.first_name} ${session.patient.last_name}`
            : "—",
          doctor_name: session.doctor ? `Dr. ${session.doctor.last_name}` : "—",
          reason: session.reason || "",
          createdAt: session.createdAt,
        })),
        cashTrend,
        generatedAt: now,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the cashier dashboard.",
      error: error.message,
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const [patients, sessions, doctors, users] = await Promise.all([
      buildStat(Patient, 7),
      buildStat(DialysisSession, 30),
      buildStat(Doctor, 30),
      buildStat(User, 30),
    ]);

    const recentSessionsRaw = await DialysisSession.find()
      .populate("patient", "patient_id first_name last_name")
      .populate("doctor", "first_name last_name")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSessions = recentSessionsRaw.map((session) => ({
      _id: session._id,
      session_id: session.session_id,
      patient_id: session.patient?.patient_id || "—",
      patient_name: session.patient
        ? `${session.patient.first_name} ${session.patient.last_name}`
        : "—",
      doctor_name: session.doctor ? `Dr. ${session.doctor.last_name}` : "—",
      createdAt: session.createdAt,
    }));

    const monday = getMondayOfCurrentWeek();
    const weekSessions = await DialysisSession.find({
      createdAt: { $gte: monday },
    }).select("createdAt");

    const sessionTrends = WEEK_LABELS.map((label, index) => {
      const dayStart = new Date(monday.getTime() + index * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);

      const count = weekSessions.filter(
        (session) => session.createdAt >= dayStart && session.createdAt < dayEnd
      ).length;

      return { day: label, count };
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + DAY_MS);

    const todaySessions = await DialysisSession.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    }).select("payment_type");

    const byPaymentType = Object.fromEntries(PAYMENT_TYPES.map((type) => [type, 0]));
    todaySessions.forEach((session) => {
      if (session.payment_type in byPaymentType) {
        byPaymentType[session.payment_type] += 1;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          patients,
          sessions,
          doctors,
          ...(normalizeRole(req.user?.role) === ROLES.ADMIN ? { users } : {}),
        },
        recentSessions,
        sessionTrends,
        sessionOverview: {
          today: todaySessions.length,
          byPaymentType,
        },
      },
    });
  } catch (error) {
    console.error("Get Dashboard Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard summary.",
      error: error.message,
    });
  }
};
