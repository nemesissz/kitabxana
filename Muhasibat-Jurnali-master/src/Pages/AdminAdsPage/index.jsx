import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const EMPTY_FORM = { title: "", description: "", priority: "normal", is_active: true, image: null };

function AdminAdsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [editAnnId, setEditAnnId] = useState(null);
  const [annForm, setAnnForm] = useState(EMPTY_FORM);
  const [annLoader, setAnnLoader] = useState(false);

  // null = not yet determined; false = global; true = non-main institution admin
  const [isNonMain, setIsNonMain] = useState(null);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(`${Base_Url_Server}users/${adminID}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((res) => store.admin.setData(res.data.data.user))
      .catch((err) => {
        if (err.response?.status === 401) {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        }
      });
  }, []);

  // Load institutions alongside initial data
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(`${Base_Url_Server}institutions`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((r) => setInstitutions(r.data.data.institutions || []))
      .catch(() => {});
    fetchAnnouncements();
  }, []);

  // Resolve scope once admin + institutions available
  useEffect(() => {
    const admin = store.admin.data;
    if (!admin) return;
    if (institutions.length === 0 && !admin.institutionId) { setIsNonMain(false); return; }
    if (institutions.length === 0) return;
    const role = admin.role ?? 0;
    const institutionId = admin.institutionId ?? null;
    if (role >= 3 || !institutionId) { setIsNonMain(false); return; }
    const inst = institutions.find((i) => i.id === institutionId);
    setIsNonMain(!inst?.is_main);
  }, [store.admin.data, institutions]);

  const fetchAnnouncements = async () => {
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const res = await axios.get(`${Base_Url_Server}announcements/admin`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setAnnouncements(res.data.data.announcements || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnnChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "image" && files?.length > 0) {
      setAnnForm((p) => ({ ...p, image: files[0] }));
    } else {
      setAnnForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    setAnnLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const fd = new FormData();
      fd.append("title", annForm.title);
      fd.append("description", annForm.description);
      fd.append("priority", annForm.priority);
      fd.append("is_active", annForm.is_active ? 1 : 0);
      if (annForm.image) fd.append("image", annForm.image);

      if (editAnnId) {
        await axios.put(`${Base_Url_Server}announcements/${editAnnId}`, fd, {
          headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": "multipart/form-data" },
        });
        Swal.fire("Uğur ✅", "Elan yeniləndi!", "success");
      } else {
        await axios.post(`${Base_Url_Server}announcements`, fd, {
          headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": "multipart/form-data" },
        });
        Swal.fire("Uğur ✅", "Elan əlavə edildi!", "success");
      }
      setEditAnnId(null);
      setAnnForm(EMPTY_FORM);
      fetchAnnouncements();
    } catch (err) {
      Swal.fire("Xəta ❌", err.response?.data?.message || "Əməliyyat uğursuz oldu.", "error");
    } finally {
      setAnnLoader(false);
    }
  };

  const handleAnnEdit = (ann) => {
    setEditAnnId(ann.id);
    setAnnForm({
      title: ann.title,
      description: ann.description || "",
      priority: ann.priority || "normal",
      is_active: ann.is_active === 1,
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnnDelete = async (id) => {
    const result = await Swal.fire({
      title: "Silmək istədiyinizdən əminsiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.delete(`${Base_Url_Server}announcements/${id}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setAnnouncements((p) => p.filter((a) => a.id !== id));
      Swal.fire("Silindi!", "Elan silindi.", "success");
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Silinə bilmədi.", "error");
    }
  };

  return (
    <div className={styles.adminAds}>
      <div className={styles.header}>
        <h3>Elanları idarə et</h3>
        {isNonMain && (
          <span className={styles.scopeNote}>
            Yalnız öz müəssisənizin elanlarını görürsünüz
          </span>
        )}
      </div>

      <div className={styles.formSection}>
        <h4>{editAnnId ? "Elanı redaktə et" : "Yeni elan əlavə et"}</h4>
        {isNonMain && !editAnnId && (
          <p className={styles.formNote}>
            Bu elan yalnız müəssisənizin istifadəçilərinə görünəcək.
          </p>
        )}
        <form onSubmit={handleAnnSubmit}>
          <div className={styles.inputGroup}>
            <label>Ad *</label>
            <input
              type="text"
              name="title"
              value={annForm.title}
              onChange={handleAnnChange}
              required
              placeholder="Elanın adı"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Təsvir *</label>
            <textarea
              name="description"
              value={annForm.description}
              onChange={handleAnnChange}
              required
              placeholder="Elan mətni"
              rows={4}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Prioritet</label>
              <select name="priority" value={annForm.priority} onChange={handleAnnChange}>
                <option value="normal">Normal</option>
                <option value="urgent">Təcili</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Şəkil (istəyə bağlı)</label>
              <input type="file" name="image" accept="image/*" onChange={handleAnnChange} />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={annForm.is_active}
                onChange={handleAnnChange}
              />
              &nbsp;Aktiv
            </label>
          </div>
          <div className={styles.buttonsWrapper}>
            <button type="submit" disabled={annLoader}>
              {annLoader ? "Yüklənir..." : editAnnId ? "Yenilə" : "Əlavə et"}
            </button>
            {editAnnId && (
              <button type="button" onClick={() => { setEditAnnId(null); setAnnForm(EMPTY_FORM); }}>
                Ləğv et
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.tableSection}>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Ad</th>
              <th>Prioritet</th>
              <th>Əhatə</th>
              <th>Şəkil</th>
              <th>Status</th>
              <th>Tarix</th>
              <th>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((ann, i) => (
              <tr key={ann.id}>
                <td>{i + 1}</td>
                <td>{ann.title}</td>
                <td>
                  <span className={ann.priority === "urgent" ? styles.urgent : styles.normal}>
                    {ann.priority === "urgent" ? "Təcili" : "Normal"}
                  </span>
                </td>
                <td>
                  {ann.institution_id
                    ? <span className={styles.scopeInst}>{ann.institution_name || `#${ann.institution_id}`}</span>
                    : <span className={styles.scopeGlobal}>Ümumi</span>}
                </td>
                <td>
                  {ann.image
                    ? <img src={ann.image} alt="" style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4 }} />
                    : "—"}
                </td>
                <td>
                  <span className={ann.is_active === 1 ? styles.active : styles.inactive}>
                    {ann.is_active === 1 ? "Aktiv" : "Deaktiv"}
                  </span>
                </td>
                <td>{new Date(ann.created_at).toLocaleDateString("az-AZ")}</td>
                <td>
                  <button onClick={() => handleAnnEdit(ann)}><EditDocumentIcon /></button>
                  <button onClick={() => handleAnnDelete(ann.id)}><DeleteIcon /></button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                  Hələ elan yoxdur
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminAdsPage;
