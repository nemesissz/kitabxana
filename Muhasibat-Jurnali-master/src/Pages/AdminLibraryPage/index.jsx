import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import CircularProgress from "@mui/material/CircularProgress";
import { useLanguages } from "../../Hooks/useLanguages";
import "flag-icons/css/flag-icons.min.css";
const STATUS_LABELS = { pending: "Gözləyən", approved: "Qəbul" };

const EMPTY_FILTERS = { category: "", language: "", status: "", uploadedBy: "" };

function AdminLibraryPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const { languages } = useLanguages();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pdfsTypes, setPdfsTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const filterRef = useRef(null);
  const debounceRef = useRef(null);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [editingBook, setEditingBook] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const adminRole = store.admin.data?.role ?? 0;
  const adminInstId = store.admin.data?.institutionId ?? null;
  const adminInst = institutions.find(i => i.id === adminInstId);
  const adminWorkerType = store.admin.data?.workerType || null;
  const adminUserId = store.admin.data?.id ?? null;
  const pdfReviewPermission = store.admin.data?.pdfReviewPermission || 'none';
  const canApprovePdfs = adminRole >= 4 || !adminInstId ||
    (institutions.length > 0 && adminInst?.is_main === true) ||
    pdfReviewPermission === 'allowed';

  // Əsas müəssisə işçisi: role=2 + əsas müəssisəyə aiddir
  const isMainInstWorker = adminRole === 2 && !!adminInstId && !!adminInst?.is_main;

  const workerCanEditPdfType = (pdfTypeName) => {
    if (!adminWorkerType) return true;
    const n = (pdfTypeName || '').toLowerCase();
    if (n.includes('ikisi')) return false;
    if (adminWorkerType === 'elektron') return n.includes('elektron');
    if (adminWorkerType === 'fiziki') return n.includes('fiziki');
    return false;
  };

  // PDF-i redaktə/silmə icazəsi: pdf tipi + əsas müəssisə işçisi yalnız öz yükləmələri
  const canEditPdf = (b) =>
    workerCanEditPdfType(b.pdf_type?.name) &&
    (!isMainInstWorker || b.uploaded_by === adminUserId);

  const fetchAdminUser = () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((r) => store.admin.setData(r.data.data.user))
      .catch(() => navigate("/admin/login"));
  };

  useEffect(() => {
    fetchAdminUser();
    const onVisible = () => { if (document.visibilityState === "visible") fetchAdminUser(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((r) => setCategories(r.data.data.categories || []))
      .catch(() => {});
    axios.get(Base_Url_Server + "pdfs-types")
      .then((r) => setPdfsTypes(r.data.data.types || []))
      .catch(() => {});
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(Base_Url_Server + "users", { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then((r) => setUsers(r.data.data.users || []))
      .catch(() => {});
    axios.get(Base_Url_Server + "institutions", { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then((r) => setInstitutions(r.data.data.institutions || []))
      .catch(() => {});
  }, []);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPdfs = useCallback(async (p = 1, q = search, f = filters) => {
    setLoading(true);
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const params = new URLSearchParams({ page: p, limit: 20, adminView: "1" });
      if (q.trim()) params.append("search", q.trim());
      if (f.category) params.append("categoryId", f.category);
      if (f.language) params.append("language", f.language);
      if (f.status) params.append("status", f.status);
      if (f.uploadedBy) params.append("uploadedBy", f.uploadedBy);
      const res = await axios.get(`${Base_Url_Server}pdfs?${params}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setBooks(res.data.data.pdfs || []);
      setPagination(res.data.data.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPdfs(page, search, filters); setSelectedIds(new Set()); }, [page]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPdfs(1, val, filters), 400);
  };

  const openFilterPanel = () => {
    setDraftFilters({ ...filters });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    setFilterOpen(false);
    setSelectedIds(new Set());
    fetchPdfs(1, search, draftFilters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setPage(1);
    setFilterOpen(false);
    setSelectedIds(new Set());
    fetchPdfs(1, search, EMPTY_FILTERS);
  };

  // Active filter summary for button label
  const activeFilterSummary = () => {
    const parts = [];
    if (filters.category) {
      const cat = categories.find(c => String(c.id) === String(filters.category));
      if (cat) parts.push(cat.name);
    }
    if (filters.language) {
      const lang = languages.find(l => l.code === filters.language);
      parts.push(lang ? lang.name : filters.language.toUpperCase());
    }
    if (filters.status) parts.push(STATUS_LABELS[filters.status] || filters.status);
    if (filters.uploadedBy) {
      const u = users.find(u => String(u.id) === String(filters.uploadedBy));
      if (u) parts.push(u.email.split("@")[0]);
    }
    return parts.join(" / ");
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const summary = activeFilterSummary();

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "PDF-i silmək istədiyinizdən əminsiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.delete(`${Base_Url_Server}pdfs/${id}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: "Silindi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Silinə bilmədi", "error");
    }
  };

  const handleApprove = async (id) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(`${Base_Url_Server}pdfs/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: "Qəbul edildi!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "PDF-i rədd edib siləcəksiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.delete(`${Base_Url_Server}pdfs/${id}/reject`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: "Rədd edildi!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (books.every(b => selectedIds.has(b.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(books.map(b => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `${selectedIds.size} PDF silinsin?`,
      text: "Bu əməliyyat geri alına bilməz.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await Promise.all([...selectedIds].map(id =>
        axios.delete(`${Base_Url_Server}pdfs/${id}`, { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      ));
      setSelectedIds(new Set());
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: "Silindi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Silinə bilmədi", "error");
    }
  };

  const handleBulkApprove = async () => {
    const pendingIds = books.filter(b => selectedIds.has(b.id) && b.status === "pending").map(b => b.id);
    if (!pendingIds.length) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await Promise.all(pendingIds.map(id =>
        axios.patch(`${Base_Url_Server}pdfs/${id}/approve`, {}, { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      ));
      setSelectedIds(new Set());
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: `${pendingIds.length} PDF təsdiqləndi!`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const handleBulkReject = async () => {
    const pendingIds = books.filter(b => selectedIds.has(b.id) && b.status === "pending").map(b => b.id);
    if (!pendingIds.length) return;
    const result = await Swal.fire({
      title: `${pendingIds.length} PDF rədd edilsin?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await Promise.all(pendingIds.map(id =>
        axios.delete(`${Base_Url_Server}pdfs/${id}/reject`, { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      ));
      setSelectedIds(new Set());
      await fetchPdfs(page, search, filters);
      Swal.fire({ icon: "success", title: `${pendingIds.length} PDF rədd edildi!`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const openEdit = (book) => {
    setEditingBook(book);
    setEditData({
      title: book.title || "",
      description: book.description || "",
      pdf_type_id: book.pdf_type?.id ? String(book.pdf_type.id) : "",
      _typeName: book.pdf_type?.name || "",
      category_id: book.category_id || "",
      language: book.language || "az",
      order_number: book.order_number || "",
      author: book.author || "",
      isbn: book.isbn || "",
      publication_year: book.publication_year || "",
      publisher_location: book.publisher_location || "",
      foreword: book.foreword || "",
      price: book.price !== undefined ? String(book.price) : "0",
      allow_download: book.allow_download !== undefined ? String(book.allow_download) : "1",
      institution_id: book.institution_id ? String(book.institution_id) : "",
      newCoverImage: null,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editIsBookFiziki && !editData.institution_id) {
      return Swal.fire("Xəta", "Kitab-fiziki üçün müəssisə seçilməlidir", "error");
    }
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setEditLoading(true);
    try {
      const fd = new FormData();
      const { newCoverImage, _typeName, ...textFields } = editData;
      const submitFields = editIsBookFiziki ? { ...textFields, allow_download: "0" } : textFields;
      Object.entries(submitFields).forEach(([k, v]) => { if (v !== "" && v !== null) fd.append(k, v); });
      if (newCoverImage) fd.append("image", newCoverImage);
      await axios.put(`${Base_Url_Server}pdfs/${editingBook.id}`, fd, {
        headers: { Authorization: `Bearer ${tokenAdmin}`, "Content-Type": "multipart/form-data" },
      });
      await fetchPdfs(page, search, filters);
      setEditingBook(null);
      Swal.fire({ icon: "success", title: "Yeniləndi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Yenilənə bilmədi", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const allSelected = books.length > 0 && books.every(b => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;
  const selectedPendingCount = books.filter(b => selectedIds.has(b.id) && b.status === "pending").length;

  // Edit modalı üçün tip növü — _typeName state ilə saxlanır
  const editTypeLower = (editData._typeName || "").toLowerCase();
  const editIsBookElektron = editTypeLower.includes("elektron") && !editTypeLower.includes("ikisi");
  const editIsBookFiziki   = editTypeLower.includes("fiziki")   && !editTypeLower.includes("ikisi");
  const editIsBookHerIkisi = editTypeLower.includes("ikisi");
  const editIsBookCategory = editIsBookElektron || editIsBookFiziki || editIsBookHerIkisi;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>PDF İdarəetmə</h2>
        <button className={styles.addBtn} onClick={() => navigate("/admin/add-book")}>
          <AddIcon /> Yeni PDF
        </button>
      </div>

      {/* Toolbar: Search + Filter button */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Ada, təsvir, əmr №-ə görə axtar..."
            value={search}
            onChange={handleSearchChange}
          />
          {loading && <CircularProgress size={16} className={styles.spin} />}
        </div>

        <div className={styles.filterWrap} ref={filterRef}>
          <button
            className={`${styles.filterBtn} ${hasActiveFilters ? styles.filterActive : ""}`}
            onClick={filterOpen ? () => setFilterOpen(false) : openFilterPanel}
          >
            <FilterListIcon fontSize="small" />
            {summary ? <span className={styles.filterSummary}>{summary}</span> : "Filter"}
            {hasActiveFilters && (
              <span
                className={styles.clearX}
                onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                title="Filteri təmizlə"
              >
                <CloseIcon style={{ fontSize: 14 }} />
              </span>
            )}
          </button>

          {filterOpen && (
            <div className={styles.filterPanel}>
              <div className={styles.filterRow}>
                <label>Kateqoriya</label>
                <select
                  value={draftFilters.category}
                  onChange={(e) => setDraftFilters(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="">Hamısı</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterRow}>
                <label>Dil</label>
                <select
                  value={draftFilters.language}
                  onChange={(e) => setDraftFilters(p => ({ ...p, language: e.target.value }))}
                >
                  <option value="">Hamısı</option>
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterRow}>
                <label>Status</label>
                <select
                  value={draftFilters.status}
                  onChange={(e) => setDraftFilters(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="">Hamısı</option>
                  <option value="pending">Gözləyən</option>
                  <option value="approved">Qəbul edilmiş</option>
                </select>
              </div>
              <div className={styles.filterRow}>
                <label>İstifadəçi</label>
                <select
                  value={draftFilters.uploadedBy}
                  onChange={(e) => setDraftFilters(p => ({ ...p, uploadedBy: e.target.value }))}
                >
                  <option value="">Hamısı</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterActions}>
                <button className={styles.clearBtn} onClick={clearFilters}>Təmizlə</button>
                <button className={styles.applyBtn} onClick={applyFilters}>Tətbiq et</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {pagination && (
        <p className={styles.stats}>
          Cəmi <strong>{pagination.total}</strong> PDF · Səhifə {pagination.current_page}/{pagination.total_pages}
        </p>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedIds.size} seçilib</span>
          {selectedPendingCount > 0 && canApprovePdfs && (
            <>
              <button className={styles.bulkApproveBtn} onClick={handleBulkApprove}>
                ✓ Təsdiqlə ({selectedPendingCount})
              </button>
              <button className={styles.bulkRejectBtn} onClick={handleBulkReject}>
                ✕ Rədd et ({selectedPendingCount})
              </button>
            </>
          )}
          <button className={styles.bulkDelBtn} onClick={handleBulkDelete}>
            🗑 Sil ({selectedIds.size})
          </button>
          <button className={styles.bulkClearBtn} onClick={() => setSelectedIds(new Set())}>
            Ləğv et
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading && books.length === 0 ? (
          <div className={styles.center}><CircularProgress /></div>
        ) : books.length === 0 ? (
          <div className={styles.center}>Heç bir PDF tapılmadı</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkCell}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    title="Hamısını seç"
                  />
                </th>
                <th>ID</th>
                <th>Şəkil</th>
                <th>Ad</th>
                <th>Kateqoriya</th>
                <th>Tip</th>
                <th>Dil</th>
                <th>Status</th>
                <th>Yükləyən</th>
                <th>Əmr / Müəllif</th>
                <th>Tarix</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className={`${b.status === "pending" ? styles.rowPending : ""} ${selectedIds.has(b.id) ? styles.rowSelected : ""}`}>
                  <td className={styles.checkCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(b.id)}
                      onChange={() => toggleSelect(b.id)}
                    />
                  </td>
                  <td>{b.id}</td>
                  <td>
                    {b.image_path ? (
                      <img
                        src={formatServerFilePath(b.image_path)}
                        alt={b.title}
                        className={styles.thumb}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className={styles.noThumb}>PDF</div>
                    )}
                  </td>
                  <td className={styles.titleCell} title={b.title}>{b.title}</td>
                  <td>{b.category?.name || <span className={styles.none}>—</span>}</td>
                  <td>{b.pdf_type?.name || <span className={styles.none}>—</span>}</td>
                  <td>
                    {b.language ? (() => {
                      const flagCode = b.language_flag
                        || languages.find(l => l.code === b.language)?.flag
                        || b.language;
                      return (
                        <span
                          className={`fi fi-${flagCode} ${styles.langFlag}`}
                          title={b.language.toUpperCase()}
                        />
                      );
                    })() : "—"}
                  </td>
                  <td>
                    {b.status === "pending"
                      ? <span className={styles.statusPending}>Gözləyir</span>
                      : <span className={styles.statusApproved}>Qəbul</span>}
                  </td>
                  <td className={styles.small}>
                    {b.uploader_email
                      ? <span className={styles.uploaderEmail} title={b.uploader_email}>{b.uploader_email.split("@")[0]}</span>
                      : <span className={styles.none}>—</span>}
                  </td>
                  <td className={styles.small}>
                    {b.order_number || b.author || <span className={styles.none}>—</span>}
                  </td>
                  <td className={styles.small}>{b.created_at?.split("T")[0]}</td>
                  <td>
                    {(() => {
                      const bType = (b.pdf_type?.name || '').toLowerCase();
                      const bIsFiziki   = bType.includes('fiziki') && !bType.includes('ikisi');
                      const bIsHerIkisi = bType.includes('ikisi');
                      return (
                        <div className={styles.actions}>
                          {b.status === "pending" && canApprovePdfs && (
                            <>
                              <button className={styles.approveBtn} onClick={() => handleApprove(b.id)} title="Qəbul et">
                                <CheckCircleOutlineIcon fontSize="small" />
                              </button>
                              <button className={styles.rejectBtn} onClick={() => handleReject(b.id)} title="Rədd et">
                                <CancelOutlinedIcon fontSize="small" />
                              </button>
                            </>
                          )}
                          {bIsFiziki ? (
                            <span className={styles.orderBadge} title="Sıra №">
                              {b.order_number || <span className={styles.none}>—</span>}
                            </span>
                          ) : (
                            <button className={styles.viewBtn} onClick={() => window.open(`/library/${b.id}/read`, "_blank")} title="Bax">
                              <VisibilityIcon fontSize="small" />
                            </button>
                          )}
                          {bIsHerIkisi && (
                            <span className={styles.qtyBadge} title="Say">
                              {b.quantity ?? 1}
                            </span>
                          )}
                          {canEditPdf(b) && (
                            <button className={styles.editBtn} onClick={() => openEdit(b)} title="Redaktə et">
                              <EditIcon fontSize="small" />
                            </button>
                          )}
                          {canEditPdf(b) && (
                            <button className={styles.delBtn} onClick={() => handleDelete(b.id)} title="Sil">
                              <DeleteIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Əvvəlki</button>
          <span>{page} / {pagination.total_pages}</span>
          <button disabled={page === pagination.total_pages} onClick={() => setPage(p => p + 1)}>Növbəti →</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <div className={styles.modalOverlay} onClick={() => setEditingBook(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>PDF Redaktə</h3>
              <button className={styles.closeModal} onClick={() => setEditingBook(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <label>Ad <span>*</span></label>
              <input
                type="text" value={editData.title} required
                onChange={(e) => setEditData(p => ({ ...p, title: e.target.value }))}
              />

              <label>PDF Tipi</label>
              <select
                value={editData.pdf_type_id}
                onChange={(e) => {
                  const type = pdfsTypes.find(t => String(t.id) === e.target.value);
                  const newTypeName = (type?.name || "").toLowerCase();
                  const newIsElektron = newTypeName.includes("elektron") && !newTypeName.includes("ikisi");
                  const newIsHerIkisi = newTypeName.includes("ikisi");
                  const newIsFiziki   = newTypeName.includes("fiziki") && !newTypeName.includes("ikisi");
                  const newIsKitab    = newIsElektron || newIsFiziki || newIsHerIkisi;
                  setEditData(p => ({
                    ...p,
                    pdf_type_id: e.target.value,
                    _typeName: type?.name || "",
                    institution_id:     (newIsFiziki || newIsHerIkisi) ? p.institution_id : "",
                    price:              newIsElektron ? "0" : p.price,
                    allow_download:     newIsFiziki ? "0" : p.allow_download,
                    order_number:       (newIsElektron || newIsFiziki) ? "" : p.order_number,
                    isbn:               newIsKitab ? p.isbn : "",
                    publication_year:   newIsKitab ? p.publication_year : "",
                    publisher_location: newIsKitab ? p.publisher_location : "",
                    foreword:           newIsKitab ? p.foreword : "",
                  }));
                }}
              >
                <option value="">— Tipsiz —</option>
                {pdfsTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <label>Kateqoriya</label>
              <select
                value={editData.category_id}
                onChange={(e) => setEditData(p => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">— Kateqoriyasız —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label>Dil</label>
              <select
                value={editData.language}
                onChange={(e) => setEditData(p => ({ ...p, language: e.target.value }))}
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>

              {(editIsBookFiziki || editIsBookHerIkisi) && (
                <>
                  <label>Müəssisə (kitabın saxlanıldığı kitabxana){editIsBookFiziki ? <span style={{ color: "red" }}> *</span> : null}</label>
                  <select
                    value={editData.institution_id}
                    onChange={(e) => setEditData(p => ({ ...p, institution_id: e.target.value }))}
                    required={editIsBookFiziki}
                  >
                    <option value="">— Müəssisə seçin —</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={String(inst.id)}>{inst.name}</option>
                    ))}
                  </select>
                </>
              )}

              <label>Müəllif (istəyə bağlı)</label>
              <input type="text" value={editData.author} placeholder="Müəllifin adı"
                onChange={(e) => setEditData(p => ({ ...p, author: e.target.value }))} />

              {editIsBookCategory && (
                <>
                  <label>ISBN (istəyə bağlı)</label>
                  <input type="text" value={editData.isbn} placeholder="Məs: 978-9952-8283-0-1"
                    maxLength={20}
                    onChange={(e) => setEditData(p => ({ ...p, isbn: e.target.value }))} />
                </>
              )}

              {(!editIsBookElektron && !editIsBookFiziki) && (
                <>
                  <label>Nömrə / Sıra № (istəyə bağlı)</label>
                  <input type="text" value={editData.order_number} placeholder="Məs: 45/2025"
                    onChange={(e) => setEditData(p => ({ ...p, order_number: e.target.value }))} />
                </>
              )}

              {editIsBookCategory && (
                <>
                  <label>Nəşr tarixi (istəyə bağlı)</label>
                  <input type="number" value={editData.publication_year} placeholder="Məs: 2023"
                    min="1800" max={new Date().getFullYear()}
                    onChange={(e) => setEditData(p => ({ ...p, publication_year: e.target.value }))} />

                  <label>Nəşriyyat yeri (istəyə bağlı)</label>
                  <input type="text" value={editData.publisher_location} placeholder="Məs: Bakı"
                    onChange={(e) => setEditData(p => ({ ...p, publisher_location: e.target.value }))} />

                  <label>Ön söz (istəyə bağlı)</label>
                  <textarea rows={3} value={editData.foreword} placeholder="Kitabın ön sözü..."
                    onChange={(e) => setEditData(p => ({ ...p, foreword: e.target.value }))} />
                </>
              )}

              {!editIsBookElektron && (
                <>
                  <label>Qiymət (0 = pulsuz)</label>
                  <input type="number" value={editData.price} placeholder="0.00"
                    min="0" step="0.01"
                    onChange={(e) => setEditData(p => ({ ...p, price: e.target.value }))} />
                </>
              )}

              {!editIsBookFiziki && (
                <>
                  <label>Yükləmə icazəsi</label>
                  <select value={editData.allow_download}
                    onChange={(e) => setEditData(p => ({ ...p, allow_download: e.target.value }))}>
                    <option value="1">İcazə var</option>
                    <option value="0">İcazə yoxdur</option>
                  </select>
                </>
              )}

              <label>Təsvir</label>
              <textarea rows={3} value={editData.description}
                onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))} />

              <label>Üz qabığı şəkli</label>
              <div className={styles.coverEditWrap}>
                {editData.newCoverImage ? (
                  <img
                    src={URL.createObjectURL(editData.newCoverImage)}
                    alt="Yeni şəkil"
                    className={styles.coverPreview}
                  />
                ) : editingBook.image_path ? (
                  <img
                    src={formatServerFilePath(editingBook.image_path)}
                    alt="Mövcud şəkil"
                    className={styles.coverPreview}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className={styles.coverPlaceholder}>Şəkil yoxdur</div>
                )}
                <div className={styles.coverActions}>
                  <label className={styles.coverUploadBtn}>
                    Şəkil seç
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) setEditData(p => ({ ...p, newCoverImage: f }));
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {editData.newCoverImage && (
                    <button
                      type="button"
                      className={styles.coverClearBtn}
                      onClick={() => setEditData(p => ({ ...p, newCoverImage: null }))}
                    >
                      Ləğv et
                    </button>
                  )}
                </div>
                {editData.newCoverImage && (
                  <span className={styles.coverFileName}>{editData.newCoverImage.name}</span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingBook(null)}>Ləğv et</button>
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

export default AdminLibraryPage;
