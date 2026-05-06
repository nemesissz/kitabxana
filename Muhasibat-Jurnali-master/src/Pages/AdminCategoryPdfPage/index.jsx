import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2"; // SweetAlert importu

function AdminCategoryPagePdfs() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [displayType, setDisplayType] = useState("tax-journal");
  const [message, setMessage] = useState("");

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
        .then((res) => store.admin.setData(res.data.data.user))
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        });
    }
  }, []);
  console.log(categories);
  useEffect(() => {
    store.loader.setData(true);
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err))
      .finally(() => store.loader.setData(false));
  }, []);
console.log(Base_Url_Server + "categories/pdfs")



  const handleAddCategory = async (e) => {
    console.log(Base_Url_Server + "categories/pdfs")
    e.preventDefault();


    try {
      setLoader(true);
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.post(
        Base_Url_Server + "categories/pdfs",
        { name: newCategory, display_type: displayType },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );

      // Backend-dən yenilənmiş kateqoriyaları çəkmək
      const res = await axios.get(Base_Url_Server + "categories/pdfs");
      setCategories(res.data.data.categories);
      setNewCategory("");
      setDisplayType("tax-journal");
      setLoader(false);

      // SweetAlert ilə uğurlu mesaj
      Swal.fire({
        icon: "success",
        title: "Uğurla əlavə edildi ✅",
        text: "Yeni kateqoriya uğurla əlavə olundu!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      setLoader(false);
      Swal.fire({
        icon: "error",
        title: "Xəta ❌",
        text: err.response?.data?.message || "Kateqoriya əlavə edilə bilmədi!",
      });
      console.log(err.response?.data?.message);
    }
  };

  // Kateqoriya sil
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Silmək istədiyinizdən əminsiniz?",
      text: "Bu əməliyyatı geri qaytarmaq mümkün olmayacaq!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });

    if (result.isConfirmed) {
      try {
        const tokenAdmin = localStorage.getItem("tokenAdmin");
        console.log(Base_Url_Server + "categories/pdfs" + id)
        await axios.delete(Base_Url_Server + "categories/pdfs/" + id, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (err) {
        Swal.fire("Xəta!", "Kateqoriya silinə bilmədi.", "error");
        console.log("Silinmədi:", err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2 className={styles.title}>Kitab Kateqoriyaları</h2>

        <form onSubmit={handleAddCategory}>
          <div className={styles.inputGroup}>
            <label>Yeni Kateqoriya Əlavə Et</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Məs: Texnologiya"
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>PDF-lərin Səhifədə Düzülüşü</label>
            <select
              value={displayType}
              onChange={(e) => setDisplayType(e.target.value)}
              className={styles.input}
            >
              <option value="tax-journal">Vergi-jurnali tərzində (Aylara görə)</option>
              <option value="other-books">Sair kitablar tərzində (Tarixə görə, ən yenisi ən öncə)</option>
            </select>
          </div>
          <div className={styles.buttonsWrapper}>
            <button
              type="submit"
              className={styles.button}
              style={{ background: "#0077ff" }}
            >
              <AddIcon />
              {loader ? (
                <CircularProgress size={20} style={{ color: "#fff" }} />
              ) : (
                "Əlavə et"
              )}
            </button>
          </div>
        </form>

        {message && <div className={styles.message}>{message}</div>}

        <div style={{ marginTop: "25px" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Ad</th>
                <th>Düzülüş Tipi</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {categories
                ? categories.map((cat, i) => (
                    <tr key={cat.id}>
                      <td>{cat.id}</td>
                      <td>{cat.name}</td>
                      <td>
                        {cat.display_type === 'tax-journal' 
                          ? 'Vergi-jurnali tərzində' 
                          : cat.display_type === 'other-books'
                          ? 'Sair kitablar tərzində'
                          : 'Vergi-jurnali tərzində'}
                      </td>
                      <td>
                        <button
                          className={styles.button}
                          style={{ background: "#d64545" }}
                          onClick={() => handleDelete(cat.id)}
                        >
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                : "Yüklənir..."}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminCategoryPagePdfs;
