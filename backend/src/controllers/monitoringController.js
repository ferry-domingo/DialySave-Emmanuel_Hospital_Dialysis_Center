import DialysisSession from "../models/DialysisSession.js";
import { Patient } from "../models/Patient.js";

export const getPatientMonitoring = async (req, res) => {
    try {

        const { id } = req.params;
        
        const patient = await Patient.findById(id);

            if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
            }

        const sessions = await DialysisSession.find({
            patient: id,
        })
        .populate(
            "patient",
            "patient_id first_name last_name"
        )
        .sort({ createdAt: 1 });
            
        let phicSessions = [];
        let cashSessions = [];
        let dialyzerSessions = [];
        let packageSessions = [];
        let agreementSessions = [];

        sessions.forEach((session) => {

            if (session.payment_type === "PHIC") {
                phicSessions.push(session.createdAt);
            }

            if (session.payment_type === "CASH") {
                cashSessions.push({
                    id: session._id,
                    date: session.createdAt,
                    reason: session.reason || "",
                });
            }

            if (
                session.dialyzer &&
                session.dialyzer.name &&
                session.dialyzer.name.trim() !== ""
            ) {
                dialyzerSessions.push({
                    date: session.createdAt,
                    name: session.dialyzer.name,
                });
            }

            // PACKAGE SUMMARY
            packageSessions.push({
                _id: session._id,
                date: session.createdAt,
                epoetin: session.injections?.name || "",
                iron: session.intravenous_iron?.name || "",
                dialyzer: session.dialyzer?.name || "",
                laboratory_results: session.laboratory_results || [],
            });

            agreementSessions.push({
                sessionNo: agreementSessions.length + 1,

                sessionId: session._id,

                date: session.createdAt,

                payment_type: session.payment_type,

                patient: {
                    _id: session.patient._id,
                    patient_id: session.patient.patient_id,
                    first_name: session.patient.first_name,
                    last_name: session.patient.last_name,
                    full_name:
                        session.patient.first_name +
                        " " +
                        session.patient.last_name,
                },

                injection: session.injections,

                iron: session.intravenous_iron,

                dialyzer: session.dialyzer,

                laboratories: session.laboratory_results,

                agreement: session.agreement,
            });

        });

        res.json({
            success: true,

            phic: {
                total: phicSessions.length,
                remaining: 156 - phicSessions.length,
                dates: phicSessions,
                exceeded: phicSessions.length >= 156,
            },

            cash: {
                total: cashSessions.length,
                dates: cashSessions.map((session) => session.date),
                reasons: cashSessions.map((session) => session.reason),
                sessions: cashSessions,
            },

            dialyzer: {
                total: dialyzerSessions.length,
                sessions: dialyzerSessions,
            },

            package: {
                total: packageSessions.length,
                sessions: packageSessions,
            },

            agreement: {
                total: agreementSessions.length,
                sessions: agreementSessions,
            },
            });

    }

    catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }
};
