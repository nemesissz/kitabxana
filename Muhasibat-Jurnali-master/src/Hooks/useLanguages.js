import { useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../Constants/baseUrl";

// Bütün formalarda istifadə üçün — DB-dən dil siyahısını yükləyir
export function useLanguages() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(Base_Url_Server + "languages")
      .then(res => setLanguages(res.data.data.languages || []))
      .catch(() => setLanguages([
        { code: "az", name: "Azərbaycan dili", flag: "az" },
        { code: "ru", name: "Rus dili",        flag: "ru" },
        { code: "en", name: "İngilis dili",    flag: "gb" },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return { languages, loading };
}
