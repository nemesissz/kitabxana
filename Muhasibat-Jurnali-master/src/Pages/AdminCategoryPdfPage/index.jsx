import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";


function AdminCategoryPagePdfs() {
  const store = useContext(dataContext);
  const navigate = useNavigate();

  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  // null = not yet determined; false = global admin; true = non-main institution admin
  const [isNonMain, setIsNonMain] = useState(null);

  // Global admin: add form
  const [newCategory, setNewCategory] = useState("");

  // Edit modal
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editIsRequest, setEditIsRequest] = useState(false);

  // Non-main admin: request add form
  const [reqName, setReqName] = useState("");
  const [reqLoader, setReqLoader] = useState(false);

  // Requests list (pending for global admin, own for non-main)
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);


  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
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

  const PDF_TYPE_NAMES = ['kitab-elektron', 'kitab-fiziki', 'kitab-hər ikisi'];
  const filterTypes = (cats) =>
    (cats || []).filter((c) => !PDF_TYPE_NAMES.includes((c.name || '').toLowerCase()));

  const loadCategories = () => {
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(filterTypes(res.data.data.categories)))
      .catch((err) => console.log("Kateqoriya çəkilmədi:", err));
  };

  useEffect(() => {
    store.loader.setData(true);
    const tokenAdmin = localStorage.getItem("tokenAdmin");

    Promise.all([
      axios.get(Base_Url_Server + "categories/pdfs"),
      axios.get(Base_Url_Server + "institutions", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      }).catch(() => ({ data: { data: { institutions: [] } } })),
    ]).then(([catRes, instRes]) => {
      setCategories(filterTypes(catRes.data.data.categories));
      setInstitutions(instRes.data.data.institutions || []);
    }).catch((err) => console.log(err))
      .finally(() => store.loader.setData(false));
  }, []);

  // Determine scope once both admin data and institutions are loaded
  useEffect(() => {
    const admin = store.admin.data;
    if (!admin) return;
    // If institutions haven't loaded yet but admin has no institutionId, we can resolve early
    if (institutions.length === 0 && !admin.institutionId) {
      setIsNonMain(false);
      return;
    }
    if (institutions.length === 0) return; // wait for institutions

    const role = admin.role ?? 0;
    const institutionId = admin.institutionId ?? null;
    if (role >= 4 || !institutionId) {
      setIsNonMain(false);
      return;
    }
    const inst = institutions.find((i) => i.id === institutionId);
    // Only manager (role>=3) from main institution gets global scope
    if (inst?.is_main && role >= 3) { setIsNonMain(false); return; }
    setIsNonMain(true);
  }, [store.admin.data, institutions]);

  // Load requests once scope is known
  useEffect(() => {
    if (isNonMain === null) return;
    loadRequests();
  }, [isNonMain]);

  const refreshNotifications = () => {
    const token = localStorage.getItem("tokenAdmin");
    if (!token) return;
    axios.get(`${Base_Url_Server}admin/pending-counts`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => store.adminNotifications.setData(r.data.data)).catch(() => {});
  };

  const loadRequests = async () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setRequestsLoading(true);
    try {
      const res = await axios.get(Base_Url_Server + "categories/pdfs/requests", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error("Sorğular çəkilmədi:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Global admin: add category directly
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.post(
        Base_Url_Server + "categories/pdfs",
        { name: newCategory, display_type: "tax-journal" },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      loadCategories();
      setNewCategory("");
      Swal.fire({ icon: "success", title: "Uğurla əlavə edildi", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err.response?.data?.message || "Kateqoriya əlavə edilə bilmədi!" });
    } finally {
      setLoader(false);
    }
  };

  // Non-main admin: submit add request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setReqLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.post(
        Base_Url_Server + "categories/pdfs/requests",
        { type: "add", name: reqName, displayType: "tax-journal" },
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      setReqName("");
      await loadRequests();
      Swal.fire({ icon: "success", title: "Sorğu göndərildi", text: "Superadmin təsdiqini gözləyin", timer: 2500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err.response?.data?.message || "Sorğu göndərilə bilmədi!" });
    } finally {
      setReqLoader(false);
    }
  };

  const categoryPermission = store.admin.data?.categoryPermission || 'request';
  const canDirect = !isNonMain || categoryPermission === 'direct';

  const openEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditIsRequest(isNonMain && categoryPermission !== 'direct');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      if (editIsRequest) {
        await axios.post(
          Base_Url_Server + "categories/pdfs/requests",
          { type: "edit", categoryId: editingCat.id, name: editName, displayType: "tax-journal" },
          { headers: { Authorization: `Bearer ${tokenAdmin}` } }
        );
        setEditingCat(null);
        await loadRequests();
        Swal.fire({ icon: "success", title: "Sorğu göndərildi", text: "Superadmin təsdiqini gözləyin", timer: 2500, showConfirmButton: false });
      } else {
        await axios.put(
          Base_Url_Server + "categories/pdfs/" + editingCat.id,
          { name: editName, display_type: "tax-journal" },
          { headers: { Authorization: `Bearer ${tokenAdmin}` } }
        );
        loadCategories();
        setEditingCat(null);
        Swal.fire({ icon: "success", title: "Yeniləndi", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err.response?.data?.message || "Əməliyyat alınmadı!" });
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

  const handleApprove = async (reqId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(
        `${Base_Url_Server}categories/pdfs/requests/${reqId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      await loadRequests();
      loadCategories();
      refreshNotifications();
      Swal.fire({ icon: "success", title: "Təsdiqləndi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Əməliyyat alınmadı.", "error");
    }
  };

  const handleReject = async (reqId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(
        `${Base_Url_Server}categories/pdfs/requests/${reqId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      );
      await loadRequests();
      refreshNotifications();
      Swal.fire({ icon: "success", title: "Rədd edildi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Əməliyyat alınmadı.", "error");
    }
  };


  if (isNonMain === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2 className={styles.title}>Kitab Kateqoriyaları</h2>

        {/* ── Non-main, no access ── */}
        {isNonMain && categoryPermission === 'none' && (
          <div className={styles.infoBanner} style={{ borderColor: '#e74c3c', background: '#fff5f5', color: '#c0392b' }}>
            ⛔ Kateqoriya yaratma icazəniz yoxdur.
          </div>
        )}

        {/* ── Non-main admin: info + request add form ── */}
        {isNonMain && categoryPermission === 'request' && (
          <>
            <div className={styles.infoBanner}>
              ℹ️ Kateqoriya dəyişiklikləri birbaşa edilə bilməz — sorğu göndərin, superadmin təsdiqləsin.
            </div>
            <form onSubmit={handleSubmitRequest}>
              <div className={styles.inputGroup}>
                <label>Yeni kateqoriya sorğusu</label>
                <input
                  type="text"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Kateqoriya adı"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.buttonsWrapper}>
                <button type="submit" className={styles.button} style={{ background: "#7c3aed" }} disabled={reqLoader}>
                  {reqLoader ? <CircularProgress size={20} style={{ color: "#fff" }} /> : "Sorğu göndər"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Direct add form (global admin OR non-main with 'direct' permission) ── */}
        {canDirect && (
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
            <div className={styles.buttonsWrapper}>
              <button type="submit" className={styles.button} style={{ background: "#0077ff" }}>
                <AddIcon />
                {loader ? <CircularProgress size={20} style={{ color: "#fff" }} /> : "Əlavə et"}
              </button>
            </div>
          </form>
        )}

        {/* ── Global admin: pending requests for approval ── */}
        {!isNonMain && (
          <div className={styles.requestSection}>
            <h3 className={styles.sectionTitle}>
              Gözləyən Sorğular
              {requests.length > 0 && (
                <span className={styles.countBadge}>{requests.length}</span>
              )}
            </h3>
            {requestsLoading ? (
              <div className={styles.centerRow}><CircularProgress size={24} /></div>
            ) : requests.length === 0 ? (
              <p className={styles.emptyText}>Gözləyən sorğu yoxdur</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Müəssisə</th>
                    <th>Yeni ad</th>
                    <th>Cari ad</th>
                    <th>Tarix</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <span className={req.type === "add" ? styles.badgeAdd : styles.badgeEdit}>
                          {req.type === "add" ? "Əlavə" : "Redaktə"}
                        </span>
                      </td>
                      <td>{req.institution_name || "—"}</td>
                      <td><strong>{req.name}</strong></td>
                      <td>{req.current_category_name || "—"}</td>
                      <td>{req.created_at?.split("T")[0]}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className={styles.approveBtn} onClick={() => handleApprove(req.id)} title="Təsdiqlə">
                            <CheckIcon fontSize="small" />
                          </button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(req.id)} title="Rədd et">
                            <CloseIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Categories table ── */}
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
                ? categories.map((cat) => {
                    return (
                      <tr key={cat.id}>
                        <td>{cat.id}</td>
                        <td>
                          {cat.name}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {categoryPermission !== 'none' && (
                              <button
                                className={styles.button}
                                style={{ background: "#2c3e50", width: "auto", padding: "8px 12px" }}
                                onClick={() => openEdit(cat)}
                                title={isNonMain && categoryPermission !== 'direct' ? "Redaktə sorğusu göndər" : "Redaktə et"}
                              >
                                <EditIcon fontSize="small" />
                              </button>
                            )}
                            {canDirect && (
                              <button
                                className={styles.button}
                                style={{ background: "#d64545", width: "auto", padding: "8px 12px" }}
                                onClick={() => handleDelete(cat.id)}
                                title="Sil"
                              >
                                <DeleteIcon fontSize="small" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : "Yüklənir..."}
            </tbody>
          </table>
        </div>

        {/* ── Non-main admin: own requests list ── */}
        {isNonMain && categoryPermission === 'request' && (
          <div className={styles.requestSection}>
            <h3 className={styles.sectionTitle}>Sorğularım</h3>
            {requestsLoading ? (
              <div className={styles.centerRow}><CircularProgress size={24} /></div>
            ) : requests.length === 0 ? (
              <p className={styles.emptyText}>Hələ sorğu yoxdur</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tip</th>
                    <th>Ad</th>
                    <th>Status</th>
                    <th>Tarix</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <span className={req.type === "add" ? styles.badgeAdd : styles.badgeEdit}>
                          {req.type === "add" ? "Əlavə" : "Redaktə"}
                        </span>
                      </td>
                      <td>{req.name}</td>
                      <td>
                        <span className={
                          req.status === "pending" ? styles.badgePending
                          : req.status === "approved" ? styles.badgeApproved
                          : styles.badgeRejected
                        }>
                          {req.status === "pending" ? "Gözləyir"
                            : req.status === "approved" ? "Təsdiqləndi"
                            : "Rədd edildi"}
                        </span>
                      </td>
                      <td>{req.created_at?.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>


      {/* Edit / Request modal */}
      {editingCat && (
        <div className={styles.modalOverlay} onClick={() => setEditingCat(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editIsRequest ? "Redaktə Sorğusu" : "Kateqoriya Redaktə"}</h3>
              <button className={styles.closeModal} onClick={() => setEditingCat(null)}>✕</button>
            </div>
            {editIsRequest && (
              <p className={styles.requestNote}>
                Bu dəyişiklik sorğu kimi göndəriləcək, superadmin təsdiqləyəcək.
              </p>
            )}
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <label>Ad <span style={{ color: "#e74c3c" }}>*</span></label>
              <input
                type="text"
                value={editName}
                required
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Kateqoriya adı"
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingCat(null)}>
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={editLoading}
                  style={editIsRequest ? { background: "#7c3aed" } : {}}
                >
                  {editLoading
                    ? <CircularProgress size={16} style={{ color: "#fff" }} />
                    : editIsRequest ? "Sorğu göndər" : "Yadda saxla"}
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
