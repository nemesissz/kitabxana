import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";

function AdminCategoryPagePdfs() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [pdfType, setPdfType] = useState("emr");

  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPdfType, setEditPdfType] = useState("emr");
  const [editLoading, setEditLoading] = useState(false);

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

  const loadCategories = () => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err));
  };

  useEffect(() => {
    store.loader.setData(true);
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err))
      .finally(() => store.loader.setData(false));
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setLoader(true);
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.post(
        Base_Url_Server + "categories/pdfs",
        { name: newCategory, display_type: "tax-journal", pdf_type: pdfType },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      loadCategories();
      setNewCategory("");
      setPdfType("emr");
      setLoader(false);
      Swal.fire({
        icon: "success",
        title: "Uğurla əlavə edildi",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      setLoader(false);
      Swal.fire({
        icon: "error",
        title: "Xəta",
        text: err.response?.data?.message || "Kateqoriya əlavə edilə bilmədi!",
      });
    }
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditPdfType(cat.pdf_type || "emr");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.put(
        Base_Url_Server + "categories/pdfs/" + editingCat.id,
        { name: editName, display_type: "tax-journal", pdf_type: editPdfType },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      loadCategories();
      setEditingCat(null);
      Swal.fire({
        icon: "success",
        title: "Yeniləndi",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Xəta",
        text: err.response?.data?.message || "Kateqoriya yenilənə bilmədi!",
      });
    } finally {
      setEditLoading(false);
    }
  };

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
        await axios.delete(Base_Url_Server + "categories/pdfs/" + id, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (err) {
        Swal.fire("Xəta!", err.response?.data?.message || "Kateqoriya silinə bilmədi.", "error");
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
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>PDF növü (yükləmə formasında sahələri idarə edir)</label>
            <select
              value={pdfType}
              onChange={(e) => setPdfType(e.target.value)}
              className={styles.input}
            >
              <option value="emr">Əmr (Əmr № sahəsi göstərilir)</option>
              <option value="serecam">Şərəcam (Əmr № sahəsi göstərilir)</option>
              <option value="kitab">Kitab (Müəllif sahəsi göstərilir)</option>
            </select>
          </div>
          <div className={styles.buttonsWrapper}>
            <button type="submit" className={styles.button} style={{ background: "#0077ff" }}>
              <AddIcon />
              {loader ? <CircularProgress size={20} style={{ color: "#fff" }} /> : "Əlavə et"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: "25px" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Ad</th>
                <th>PDF Növü</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {categories
                ? categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.id}</td>
                      <td>{cat.name}</td>
                      <td>
                        {cat.pdf_type === "kitab"
                          ? "📚 Kitab"
                          : cat.pdf_type === "serecam"
                          ? "📋 Şərəcam"
                          : "📄 Əmr"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className={styles.button}
                            style={{ background: "#2c3e50", width: "auto", padding: "8px 12px" }}
                            onClick={() => openEdit(cat)}
                            title="Redaktə et"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            className={styles.button}
                            style={{ background: "#d64545", width: "auto", padding: "8px 12px" }}
                            onClick={() => handleDelete(cat.id)}
                            title="Sil"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : "Yüklənir..."}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCat && (
        <div className={styles.modalOverlay} onClick={() => setEditingCat(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Kateqoriya Redaktə</h3>
              <button className={styles.closeModal} onClick={() => setEditingCat(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <label>Ad <span style={{ color: "#e74c3c" }}>*</span></label>
              <input
                type="text"
                value={editName}
                required
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Kateqoriya adı"
              />

              <label>PDF Növü</label>
              <select value={editPdfType} onChange={(e) => setEditPdfType(e.target.value)}>
                <option value="emr">Əmr (Əmr № sahəsi göstərilir)</option>
                <option value="serecam">Şərəcam (Əmr № sahəsi göstərilir)</option>
                <option value="kitab">Kitab (Müəllif sahəsi göstərilir)</option>
              </select>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingCat(null)}>
                  Ləğv et
                </button>
                <button type="submit" className={styles.saveBtn} disabled={editLoading}>
                  {editLoading ? <CircularProgress size={16} style={{ color: "#fff" }} /> : "Yadda saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoryPagePdfs;
