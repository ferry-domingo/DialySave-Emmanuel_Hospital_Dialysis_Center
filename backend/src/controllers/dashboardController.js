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
        .populate("doctor", "first_name last_name gender")
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
          doctor_name: session.doctor ? `${session.doctor.gender === "Female" ? "DRA." : "DR."} ${session.doctor.last_name}` : "—",
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
      .populate("doctor", "first_name last_name gender")
      .sort({ createdAt: -1 })
      .limit(8);

    const recentSessions = recentSessionsRaw.map((session) => ({
      _id: session._id,
      session_id: session.session_id,
      patient_id: session.patient?.patient_id || "—",
      patient_name: session.patient
        ? `${session.patient.first_name} ${session.patient.last_name}`
        : "—",
      doctor_name: session.doctor ? `${session.doctor.gender === "Female" ? "DRA." : "DR."} ${session.doctor.last_name}` : "—",
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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const todaySessions = await DialysisSession.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    }).select("payment_type laboratory_results");

    const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
    const [
      activePatients,
      activeDoctors,
      missingCashReasons,
      alertsThisWeek,
      phicMonth,
      phicYear,
      readyAgreements,
      phicUsage,
      sessionsThisYear,
      monthlySessionDetails,
      yearlySessionDetails,
      historySessionDetails,
      pendingAdmissionRelay,
    ] = await Promise.all([
      Patient.countDocuments({ status: "Active" }),
      Doctor.countDocuments({ status: "Active" }),
      DialysisSession.countDocuments({
        payment_type: "CASH",
        $or: [{ reason: /^\s*$/ }, { reason: null }, { reason: { $exists: false } }],
      }),
      Notification.countDocuments({ createdAt: { $gte: weekStart } }),
      DialysisSession.countDocuments({ payment_type: "PHIC", createdAt: { $gte: monthStart, $lt: todayEnd } }),
      DialysisSession.countDocuments({ payment_type: "PHIC", createdAt: { $gte: yearStart, $lt: todayEnd } }),
      DialysisSession.countDocuments({
        payment_type: "PHIC",
        createdAt: { $gte: yearStart, $lt: todayEnd },
        "agreement.acknowledgement.informedConsent": true,
        "agreement.acknowledgement.itemsAcknowledged": true,
        "agreement.signatures.patient.name": { $nin: ["", null] },
        "agreement.signatures.witness.name": { $nin: ["", null] },
        "agreement.signatures.facilityRepresentative.name": { $nin: ["", null] },
      }),
      DialysisSession.aggregate([
        { $match: { payment_type: "PHIC" } },
        { $group: { _id: "$patient", sessions: { $sum: 1 } } },
      ]),
      DialysisSession.countDocuments({ createdAt: { $gte: yearStart, $lt: todayEnd } }),
      DialysisSession.find({ createdAt: { $gte: monthStart, $lt: todayEnd } })
        .select("payment_type laboratory_results createdAt")
        .lean(),
      DialysisSession.find({ createdAt: { $gte: yearStart, $lt: todayEnd } })
        .select("payment_type createdAt")
        .lean(),
      DialysisSession.find()
        .select("payment_type createdAt")
        .sort({ createdAt: 1 })
        .lean(),
      Patient.countDocuments({
        status: "Active",
        $or: [
          { "info_relayed.phic_staff": /^\s*$/ },
          { "info_relayed.phic_staff": null },
          { "info_relayed.phic_staff": { $exists: false } },
        ],
      }),
    ]);
    const completedLabsToday = todaySessions.reduce((total, session) =>
      total + (session.laboratory_results || []).filter((result) => result.done).length, 0);

    const byPaymentType = Object.fromEntries(PAYMENT_TYPES.map((type) => [type, 0]));
    todaySessions.forEach((session) => {
      if (session.payment_type in byPaymentType) {
        byPaymentType[session.payment_type] += 1;
      }
    });

    const monthlyPaymentMix = Object.fromEntries(PAYMENT_TYPES.map((type) => [type, 0]));
    let monthlyLabChecks = 0;
    let monthlyLabsCompleted = 0;
    monthlySessionDetails.forEach((session) => {
      if (session.payment_type in monthlyPaymentMix) monthlyPaymentMix[session.payment_type] += 1;
      (session.laboratory_results || []).forEach((result) => {
        monthlyLabChecks += 1;
        if (result.done) monthlyLabsCompleted += 1;
      });
    });

    const usageDistribution = {
      below100: phicUsage.filter(({ sessions: count }) => count < 100).length,
      from100To129: phicUsage.filter(({ sessions: count }) => count >= 100 && count < 130).length,
      nearLimit: phicUsage.filter(({ sessions: count }) => count >= 130 && count < 156).length,
      atLimit: phicUsage.filter(({ sessions: count }) => count >= 156).length,
    };

    const paymentMixFor = (source) => {
      const mix = Object.fromEntries(PAYMENT_TYPES.map((type) => [type, 0]));
      source.forEach((session) => {
        if (session.payment_type in mix) mix[session.payment_type] += 1;
      });
      return mix;
    };

    const requestedDate = req.query.date ? new Date(`${req.query.date}T12:00:00`) : now;
    const analyticsDate = Number.isNaN(requestedDate.getTime()) ? now : requestedDate;
    const analyticsMonday = new Date(analyticsDate);
    analyticsMonday.setHours(0, 0, 0, 0);
    analyticsMonday.setDate(analyticsMonday.getDate() - ((analyticsMonday.getDay() + 6) % 7));
    const analyticsWeekEnd = new Date(analyticsMonday.getTime() + 7 * DAY_MS);
    const analyticsMonthStart = new Date(analyticsDate.getFullYear(), analyticsDate.getMonth(), 1);
    const analyticsMonthEnd = new Date(analyticsDate.getFullYear(), analyticsDate.getMonth() + 1, 1);
    const analyticsYearStart = new Date(analyticsDate.getFullYear(), 0, 1);
    const analyticsYearEnd = new Date(analyticsDate.getFullYear() + 1, 0, 1);
    const weekAnalyticsSessions = historySessionDetails.filter((session) => session.createdAt >= analyticsMonday && session.createdAt < analyticsWeekEnd);
    const monthAnalyticsSessions = historySessionDetails.filter((session) => session.createdAt >= analyticsMonthStart && session.createdAt < analyticsMonthEnd);
    const yearAnalyticsSessions = historySessionDetails.filter((session) => session.createdAt >= analyticsYearStart && session.createdAt < analyticsYearEnd);
    const selectedWeekTrends = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(analyticsMonday.getTime() + index * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      return { day: WEEK_LABELS[index], count: weekAnalyticsSessions.filter((session) => session.createdAt >= dayStart && session.createdAt < dayEnd).length };
    });
    const daysInMonth = new Date(analyticsDate.getFullYear(), analyticsDate.getMonth() + 1, 0).getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const monthTrends = Array.from({ length: weeksInMonth }, (_, index) => ({
      day: `W${index + 1}`,
      count: monthAnalyticsSessions.filter((session) =>
        Math.floor((new Date(session.createdAt).getDate() - 1) / 7) === index
      ).length,
    }));
    const yearTrends = Array.from({ length: 12 }, (_, index) => ({
      day: new Date(analyticsDate.getFullYear(), index, 1).toLocaleDateString("en-US", { month: "short" }),
      count: yearAnalyticsSessions.filter((session) => new Date(session.createdAt).getMonth() === index).length,
    }));
    const historyYears = [...new Set(historySessionDetails.map((session) => new Date(session.createdAt).getFullYear()))];
    const historyTrends = historyYears.map((year) => ({
      day: String(year),
      count: historySessionDetails.filter((session) => new Date(session.createdAt).getFullYear() === year).length,
    }));
    const paymentStatFor = (paymentType, periodDays = 30) => {
      const periodStart = new Date(now.getTime() - periodDays * DAY_MS);
      const previousStart = new Date(periodStart.getTime() - periodDays * DAY_MS);
      const matchingSessions = historySessionDetails.filter((session) => session.payment_type === paymentType);
      const current = matchingSessions.filter((session) => session.createdAt >= periodStart && session.createdAt < now).length;
      const previous = matchingSessions.filter((session) => session.createdAt >= previousStart && session.createdAt < periodStart).length;
      return { total: matchingSessions.length, periodDays, changePercent: percentChange(current, previous) };
    };

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
        sessionAnalytics: {
          selectedDate: analyticsDate,
          week: { trends: selectedWeekTrends, total: weekAnalyticsSessions.length, byPaymentType: paymentMixFor(weekAnalyticsSessions) },
          month: { trends: monthTrends, total: monthAnalyticsSessions.length, byPaymentType: paymentMixFor(monthAnalyticsSessions) },
          year: { trends: yearTrends, total: yearAnalyticsSessions.length, byPaymentType: paymentMixFor(yearAnalyticsSessions) },
          history: { trends: historyTrends, total: historySessionDetails.length, byPaymentType: paymentMixFor(historySessionDetails) },
        },
        sessionPaymentStats: {
          PHIC: paymentStatFor("PHIC"),
          CASH: paymentStatFor("CASH"),
        },
        operationalSnapshot: {
          activePatients,
          activeDoctors,
          sessionsToday: todaySessions.length,
          missingCashReasons,
          completedLabsToday,
          alertsThisWeek,
        },
        philHealthSnapshot: {
          sessionsThisMonth: phicMonth,
          sessionsThisYear: phicYear,
          readyAgreements,
          pendingAgreements: Math.max(0, phicYear - readyAgreements),
          patientsNearLimit: usageDistribution.nearLimit,
          patientsAtLimit: usageDistribution.atLimit,
          coverageShare: sessionsThisYear ? Math.round((phicYear / sessionsThisYear) * 100) : 0,
          agreementReadiness: phicYear ? Math.round((readyAgreements / phicYear) * 100) : 0,
          pendingAdmissionRelay,
          monthlyPaymentMix,
          monthlyLabChecks,
          monthlyLabsCompleted,
          labCompletionRate: monthlyLabChecks ? Math.round((monthlyLabsCompleted / monthlyLabChecks) * 100) : 0,
          usageDistribution,
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
