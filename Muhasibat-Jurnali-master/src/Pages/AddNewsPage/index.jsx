import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import Base_Url_Server from "../../Constants/baseUrl";
import axios from "axios";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";

function AddNewsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    categoryId: "",
    date: "",
    language: "az",
  });
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories")
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err));
  }, []);

  // ✅ Admin token yoxlaması
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");

    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      navigate("/admin/login");
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        })
        .then((response) => {
          store.admin.setData(response.data.data.user);
        })
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        });
    }
  }, []);

  // ✅ Input dəyişiklikləri
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Şəkil seçimi
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImageFile(file);
  };

  // ✅ Form göndərilməsi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const tokenAdmin = localStorage.getItem("tokenAdmin");

    if (
      !formData.title ||
      !formData.content ||
      !formData.categoryId ||
      !formData.date ||
      !imageFile
    ) {
      setLoader(false);
      Swal.fire({
        icon: "warning",
        title: "Diqqət!",
        text: "Zəhmət olmasa bütün sahələri doldurun.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("content", formData.content);
    formDataToSend.append("language", formData.language);
    formDataToSend.append("categoryId", formData.categoryId);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("image", imageFile);

    try {
      await axios.post(Base_Url_Server + "news", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${tokenAdmin}`,
        },
      });

      setLoader(false);
      Swal.fire({
        icon: "success",
        title: "Əla!",
        text: "Xəbər uğurla əlavə olundu.",
        showConfirmButton: false,
        timer: 1500,
      });

      setFormData({
        title: "",
        content: "",
        categoryId: "",
        date: "",
        language: "az",
      });
      setImageFile(null);

      setTimeout(() => navigate("/admin/news"), 1500);
    } catch (error) {
      setLoader(false);
      const msg =
        error.response?.data?.message ||
        "Xəbər əlavə edilərkən xəta baş verdi.";
      Swal.fire({
        icon: "error",
        title: "Xəta!",
        text: msg,
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className={styles.addNewsPage}>
      <div className={styles.addNews}>
        <h2>Yeni Xəbər Əlavə Et</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Başlıq</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Xəbər başlığını daxil edin"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Məzmun</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Xəbər məzmununu daxil edin"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Şəkil Faylı</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {imageFile && (
              <div className={styles.preview}>
                <img src={URL.createObjectURL(imageFile)} alt="preview" />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Kateqoriya</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="" disabled hidden>
                Kateqoriya seçin
              </option>
              {categories &&
                categories.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Dil</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
            >
              <option value="az">Azərbaycan dili</option>
              <option value="ru">Rus dili</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tarix</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loader}>
            {loader ? <CircularProgress size={20} /> : "Əlavə Et"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddNewsPage;
