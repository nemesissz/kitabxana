import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";

function AddBookPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false); // 🔹 Loader state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "az",
    price: "",
    categoryId: "",
    file: null,
    coverImage: null, // Qapaq sekli (tek)
    contentImages: [], // Mündericat sekilleri (çoklu)
    pdfDate: "", // PDF tarixi
  });
  const [categories, setCategories] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file,
    });
  };

  const handleCoverImageChange = (e) => {
    const coverImage = e.target.files[0];
    setFormData({
      ...formData,
      coverImage,
    });
  };

  const handleContentImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      contentImages: files,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true); // 🔹 Göndərilməyə başlayanda loader true olur

    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      if (!tokenAdmin) {
        setLoader(false);
        Swal.fire({
          icon: "warning",
          title: "Token tapılmadı",
          text: "Zəhmət olmasa yenidən daxil olun.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      if (
        !formData.title ||
        !formData.description ||
        !formData.language ||
        !formData.price ||
        !formData.categoryId ||
        !formData.file ||
        !formData.pdfDate
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

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("language", formData.language);
      data.append("price", formData.price);
      data.append("categoryId", formData.categoryId);
      data.append("pdfDate", formData.pdfDate);
      data.append("file", formData.file);
      if (formData.coverImage) {
        data.append("coverImage", formData.coverImage);
      }
      // Mündericat sekilleri
      if (formData.contentImages && formData.contentImages.length > 0) {
        formData.contentImages.forEach((image, index) => {
          data.append("contentImages", image);
        });
      }

      const res = await axios.post(
        `${Base_Url_Server}pdfs`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${tokenAdmin}`,
          },
        }
      );

      setLoader(false); // 🔹 Uğurla göndərildikdə loader false olur
      Swal.fire({
        icon: "success",
        title: "Uğurlu!",
        text: "Kitab uğurla əlavə olundu.",
        showConfirmButton: false,
        timer: 1500,
      });

      setFormData({
        title: "",
        description: "",
        language: "az",
        price: "",
        categoryId: "",
        file: null,
        coverImage: null,
        contentImages: [],
        pdfDate: "",
      });

      setTimeout(() => navigate("/admin/library"), 1500);
    } catch (err) {
      setLoader(false); // 🔹 Xəta olduqda da loader false
      console.error("Xəta:", err);
      Swal.fire({
        icon: "error",
        title: "Xəta!",
        text:
          err.response?.data?.message ||
          "Əlavə etmə zamanı xəta baş verdi.",
        confirmButtonColor: "#d33",
      });
    }
  };

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
        .then((response) => store.admin.setData(response.data.data.user))
        .catch(() => {
          navigate("/admin/login");
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
        });
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${Base_Url_Server}categories/pdfs`)
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.error("Kateqoriyalar alınmadı:", err));
  }, []);

  return (
    <div className={styles.addBookPage}>
      <div className={styles.addBook}>
        <h2>Yeni Kitab Əlavə Et</h2>
        <form onSubmit={handleSubmit}>
          {/* Başlıq */}
          <div className={styles.formGroup}>
            <label>Başlıq</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Təsvir */}
          <div className={styles.formGroup}>
            <label>Təsvir</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Kitab haqqında qısa təsvir yazın..."
              required
            ></textarea>
          </div>

          {/* Dil */}
          <div className={styles.formGroup}>
            <label>Dil</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="az">az</option>
              <option value="ru">ru</option>
              <option value="az-ru">az-ru</option>

            </select>
          </div>

          {/* Qiymət */}
          <div className={styles.formGroup}>
            <label>Qiymət</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Məs: 20"
              required
            />
          </div>

          {/* Kateqoriya */}
          <div className={styles.formGroup}>
            <label>Kateqoriya</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Kateqoriya seçin</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* PDF Faylı */}
          <div className={styles.formGroup}>
            <label>PDF Faylı</label>
            <input type="file" onChange={handleFileChange} required />
            {formData.file && <p>Seçilən fayl: {formData.file.name}</p>}
          </div>

          {/* Qapaq Şəkli */}
          <div className={styles.formGroup}>
            <label>Qapaq Şəkli</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleCoverImageChange}
            />
            {formData.coverImage && (
              <div className={styles.preview}>
                <img src={URL.createObjectURL(formData.coverImage)} alt="qapaq preview" />
              </div>
            )}
          </div>

          {/* Mündericat Şekilleri */}
          <div className={styles.formGroup}>
            <label>Mündericat Şekilleri</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleContentImagesChange}
            />
            {formData.contentImages.length > 0 && (
              <div className={styles.previewGrid}>
                {formData.contentImages.map((image, index) => (
                  <div key={index} className={styles.preview}>
                    <img src={URL.createObjectURL(image)} alt={`mündericat ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Tarixi */}
          <div className={styles.formGroup}>
            <label>PDF Tarixi</label>
            <input
              type="date"
              name="pdfDate"
              value={formData.pdfDate}
              onChange={handleChange}
              required
            />
            <small style={{ color: "#666", fontSize: "12px" }}>
              PDF-in nə vaxt üçün olduğunu seçin (il və ay)
            </small>
          </div>

          {/* 🔹 Submit düyməsi */}
          <button type="submit" disabled={loader}>
            {loader ? (
              <CircularProgress size={24} style={{ color: "#fff" }} />
            ) : (
              "Əlavə Et"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBookPage;
