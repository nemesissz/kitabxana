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

function AdminCategoryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
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
  useEffect(() => {
    store.loader.setData(true);
    axios
      .get(Base_Url_Server + "categories")
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err))
      .finally(() => store.loader.setData(false));
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Xəbərdarlıq!",
        text: "Kateqoriya adı boş ola bilməz!",
      });
      return;
    }

    try {
      setLoader(true);
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.post(
        Base_Url_Server + "categories",
        { name: newCategory },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );

      // Backend-dən yenilənmiş kateqoriyaları çəkmək
      const res = await axios.get(Base_Url_Server + "categories");
      setCategories(res.data.data.categories);
      setNewCategory("");
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
        await axios.delete(Base_Url_Server + "categories/" + id, {
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
        <h2 className={styles.title}>Xəbər Kateqoriyaları</h2>

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
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {categories
                ? categories.map((cat, i) => (
                    <tr key={cat.id}>
                      <td>{i + 1}</td>
                      <td>{cat.name}</td>
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

export default AdminCategoryPage;
