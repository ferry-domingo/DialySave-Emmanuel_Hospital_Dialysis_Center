import api from "./axios";

export const getPatientMonitoring = (id)=>
    api.get(`/monitoring/${id}`);
