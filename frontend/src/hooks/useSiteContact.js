import { useEffect, useState } from "react";
import api from "../api/axios";

const useSiteContact = () => {
  const [contact, setContact] = useState({ email: "", phone: "" });

  useEffect(() => {
    const loadContact = () => api.get("/site-contact").then(({ data }) => setContact(data.data)).catch(() => undefined);
    const handleChange = (event) => {
      if (event.detail?.resource === "site-contact") loadContact();
    };
    loadContact();
    window.addEventListener("dialysave:data-changed", handleChange);
    return () => window.removeEventListener("dialysave:data-changed", handleChange);
  }, []);

  return contact;
};

export default useSiteContact;
