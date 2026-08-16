import { useEffect, useState } from "react";
import api from "../api/axios";

const useSiteContact = () => {
  const [contact, setContact] = useState({ email: "", phone: "" });

  useEffect(() => {
    api.get("/site-contact").then(({ data }) => setContact(data.data)).catch(() => undefined);
  }, []);

  return contact;
};

export default useSiteContact;
