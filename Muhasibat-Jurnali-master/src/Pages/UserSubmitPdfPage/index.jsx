import { useContext, useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import Footer from "../../Layouts/Footer";
import { useLanguages } from "../../Hooks/useLanguages";

const STEPS = [
  { n: 1, label: "Əsas məlumat" },
  { n: 2, label: "Ətraflı məlumat" },
  { n: 3, label: "Fayllar" },
  { n: 4, label: "Yoxla & Göndər" },
];

const PALETTES = [
  ["#3D2914","#7A4A26"], ["#1F3A2E","#3A6B53"], ["#8B1A1A","#C0392B"],
  ["#1A2B4A","#3E5B8B"], ["#0B4F6C","#0F7895"], ["#5B3A1F","#8E6840"],
  ["#2D1B4E","#5A3D8A"], ["#1B3A1B","#2E7D32"],
];

function UserSubmitPdfPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [pdfsTypes, setPdfsTypes] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    table_of_contents: "",
    order_number: "",
    shelf_number: "",
    author: "",
    isbn: "",
    publication_year: "",
    publisher_location: "",
    foreword: "",
    price: "",
    allow_download: "1",
    language: "az",
    pdf_type_id: "",
    category_id: "",
    institution_id: "",
    quantity: "1",
    file: null,
    coverImage: null,
  });
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadLimitMb, setUploadLimitMb] = useState(20);
  const [institutions, setInstitutions] = useState([]);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [linkedBookId, setLinkedBookId] = useState(null);
  const [linkedDirection, setLinkedDirection] = useState(null); // 'fiziki' | 'elektron' | 'qty'
  const [linkedBookQuantity, setLinkedBookQuantity] = useState(null);
  const [warnSuggestions, setWarnSuggestions] = useState([]);
  const [warnSelected, setWarnSelected] = useState(false);
  const [warnPhysicalBook, setWarnPhysicalBook] = useState(null);
  const debounceRef = useRef(null);
  const warnDebounceRef = useRef(null);
  const { languages } = useLanguages();

  useEffect(() => {
    document.title = "PDF Yüklə — MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) { navigate("/login"); return; }
    axios
      .get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const userData = res.data.data.user;
        store.user.setData(userData);
        if (!userData.uploadPermission || userData.uploadPermission === "none") {
          Swal.fire({
            icon: "warning", title: "İcazə yoxdur",
            text: "PDF yükləmə icazəniz yoxdur. Adminlə əlaqə saxlayın.",
            confirmButtonColor: "#0B1F3D",
          }).then(() => navigate("/library/all"));
          return;
        }
        axios
          .get(Base_Url_Server + "settings/upload-limits/me", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => setUploadLimitMb(r.data.data.limit_mb))
          .catch(() => {});
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, []);

  useEffect(() => {
    axios.get(Base_Url_Server + "pdfs-types")
      .then((res) => {
        const types = res.data.data.types || [];
        setPdfsTypes(types);
        const defaultType = types.find(t => {
          const n = (t.name || '').toLowerCase();
          return n.includes('elektron') && !n.includes('çap');
        });
        if (defaultType) {
          setFormData(prev => ({ ...prev, pdf_type_id: String(defaultType.id) }));
        }
      })
      .catch(() => {});
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => {
        const all = res.data.data.categories || [];
        setAllCategories(all);
        setCategories(all);
      })
      .catch(() => {});
  }, []);

  const selectedType = pdfsTypes.find(t => String(t.id) === String(formData.pdf_type_id));
  const typeName = (selectedType?.name || '').toLowerCase();
  const isBookHerIkisi = typeName.includes('çap') && typeName.includes('elektron');
  const isBookFiziki   = typeName.includes('çap') && !isBookHerIkisi;
  const isBookElektron = typeName.includes('elektron') && !isBookHerIkisi;
  const isBookCategory = isBookElektron || isBookFiziki || isBookHerIkisi;
  const selectedCatName = categories.find((c) => String(c.id) === String(formData.category_id))?.name || "";
  const wt = store.user.data?.workerType || null;
  const userRole = store.user.data?.role ?? 0;
  const visibleTypes = (userRole === 2 && wt)
    ? pdfsTypes.filter(t => {
        const n = (t.name || '').toLowerCase();
        if (n.includes('çap') && n.includes('elektron')) return false;
        if (wt === 'elektron') return n.includes('elektron');
        if (wt === 'fiziki') return n.includes('çap');
        return true;
      })
    : pdfsTypes;

  useEffect(() => {
    if (isBookFiziki || isBookHerIkisi) {
      const userInstId = store.user.data?.institutionId;
      axios.get(Base_Url_Server + "institutions/public")
        .then((res) => {
          const list = res.data.data?.institutions || res.data.data || [];
          setInstitutions(list);
          if (userInstId && list.some((i) => i.id === userInstId)) {
            setFormData((prev) => ({ ...prev, institution_id: String(userInstId) }));
          }
        })
        .catch(() => {});
    }
  }, [isBookFiziki, isBookHerIkisi]);

  useEffect(() => {
    if (formData.coverImage) {
      const url = URL.createObjectURL(formData.coverImage);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [formData.coverImage]);

  const handleChange = (e) => {
    if (e.target.name === 'pdf_type_id') {
      setLinkedBookId(null);
      setLinkedDirection(null);
      setTitleSuggestions([]);
      setWarnSuggestions([]);
      setWarnSelected(false);
      const selectedT = pdfsTypes.find(t => String(t.id) === String(e.target.value));
      const newTypeName = (selectedT?.name || '').toLowerCase();
      const newIsBookHerIkisi = newTypeName.includes('çap') && newTypeName.includes('elektron');
      const needsInst = newTypeName.includes('çap');
      const userInstId = store.user.data?.institutionId || null;
      setFormData((prev) => ({
        ...prev,
        pdf_type_id: e.target.value,
        institution_id: needsInst && userInstId ? String(userInstId) : prev.institution_id,
      }));
      const q = formData.title.trim();
      const newIsBookFiziki   = newTypeName.includes('çap') && !newIsBookHerIkisi;
      const newIsBookElektron = newTypeName.includes('elektron') && !newIsBookHerIkisi;
      if (q.length >= 2 && (newIsBookFiziki || newIsBookElektron || newIsBookHerIkisi)) {
        clearTimeout(debounceRef.current);
        clearTimeout(warnDebounceRef.current);
        if (newIsBookFiziki) {
          const instId = formData.institution_id || userInstId || null;
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null, true), 350);
          warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
        } else if (newIsBookElektron) {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'fiziki', null, true), 350);
          warnDebounceRef.current = setTimeout(() => searchElektronDuplicates(q), 350);
        } else {
          const instId = formData.institution_id || userInstId || null;
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, null, instId), 350);
          warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
        }
      }
      return;
    }
    // Institution dəyişdikdə hər iki siyahını yenilə
    if (e.target.name === 'institution_id' && (isBookFiziki || isBookHerIkisi)) {
      const q = formData.title.trim();
      if (q.length >= 2) {
        clearTimeout(debounceRef.current);
        clearTimeout(warnDebounceRef.current);
        const newInstId = e.target.value || null;
        if (isBookFiziki) {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null, true), 350);
        } else {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, null, newInstId), 350);
        }
        warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, newInstId), 350);
      }
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const searchSimilarBooks = async (q, lookInType, instId, globalSearch = false) => {
    const token = localStorage.getItem("token");
    const userInstId = store.user.data?.institutionId || null;
    try {
      const params = { search: q, limit: 8, status: 'approved' };
      if (lookInType) {
        const targetType = pdfsTypes.find(t => (t.name || '').toLowerCase().includes(lookInType));
        if (targetType) params.pdfTypeId = targetType.id;
      }
      if (!globalSearch) {
        if (instId) params.anyInstId = instId;
        if (!userInstId) params.includeNoInst = 1;
      }
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setTitleSuggestions(res.data.data.pdfs || []);
    } catch {
      setTitleSuggestions([]);
    }
  };

  const searchElektronDuplicates = async (q) => {
    const token = localStorage.getItem("token");
    const userInstId = store.user.data?.institutionId || null;
    try {
      const elektronType = pdfsTypes.find(t => {
        const n = (t.name || '').toLowerCase();
        return n.includes('elektron') && !n.includes('çap');
      });
      if (!elektronType) return;
      const params = { search: q, limit: 5, status: 'approved', pdfTypeId: elektronType.id };
      if (userInstId) {
        params.anyInstId = userInstId;
      } else {
        params.uploaderNoInst = 1;
      }
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setWarnSuggestions(res.data.data.pdfs || []);
    } catch {
      setWarnSuggestions([]);
    }
  };

  const searchFizikiDuplicates = async (q, instId) => {
    const token = localStorage.getItem("token");
    try {
      const params = { search: q, limit: 5, status: 'approved' };
      if (instId) params.anyInstId = instId;
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const books = (res.data.data.pdfs || []).filter(b => {
        const n = (b.pdf_type?.name || '').toLowerCase();
        return n.includes('çap');
      });
      setWarnSuggestions(books);
    } catch {
      setWarnSuggestions([]);
    }
  };

  const hasChangedFromWarning = () => {
    if (!warnPhysicalBook) return true;
    const norm = (v) => (v === null || v === undefined) ? '' : String(v).trim();
    const simpleFields = ['title', 'author', 'isbn', 'publication_year', 'publisher_location', 'language', 'description'];
    for (const f of simpleFields) {
      if (norm(formData[f]) !== norm(warnPhysicalBook[f])) return true;
    }
    const fInst = formData.institution_id ? String(formData.institution_id) : '';
    const bInst = warnPhysicalBook.institution_id ? String(warnPhysicalBook.institution_id) : '';
    if (fInst !== bInst) return true;
    const fPrice = formData.price !== '' ? String(parseFloat(formData.price) || 0) : '0';
    const bPrice = warnPhysicalBook.price !== null && warnPhysicalBook.price !== undefined
      ? String(parseFloat(warnPhysicalBook.price) || 0) : '0';
    if (fPrice !== bPrice) return true;
    return false;
  };

  const selectWarnBook = (book) => {
    const isFizikiWarn = isBookFiziki || isBookHerIkisi;
    setFormData(prev => ({
      ...prev,
      title: book.title || '',
      description: book.description || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publication_year: book.publication_year ? String(book.publication_year) : '',
      publisher_location: book.publisher_location || '',
      language: book.language || 'az',
      price: book.price !== undefined ? String(book.price) : '0',
      allow_download: book.allow_download !== undefined ? String(book.allow_download) : '1',
      institution_id: isFizikiWarn && book.institution_id ? String(book.institution_id) : prev.institution_id,
    }));
    setWarnSelected(true);
    setWarnSuggestions([]);
    setWarnPhysicalBook(isFizikiWarn ? book : null);
  };

  const selectSuggestion = (book) => {
    const bookTypeName = (book.pdf_type?.name || '').toLowerCase();
    const herIkisiType = pdfsTypes.find(t => { const n = (t.name || '').toLowerCase(); return n.includes('çap') && n.includes('elektron'); });
    let direction, newPdfTypeId, newQuantity;

    if (isBookHerIkisi) {
      if (bookTypeName.includes('çap') && bookTypeName.includes('elektron')) {
        direction = 'qty';
        newPdfTypeId = String(formData.pdf_type_id);
        newQuantity = "1";
      } else if (bookTypeName.includes('çap')) {
        direction = 'ikisi-fiziki';
        newPdfTypeId = herIkisiType ? String(herIkisiType.id) : String(formData.pdf_type_id);
        newQuantity = "1";
      } else {
        direction = 'ikisi-elektron';
        newPdfTypeId = herIkisiType ? String(herIkisiType.id) : String(formData.pdf_type_id);
        newQuantity = "1";
      }
    } else if (isBookFiziki && bookTypeName.includes('çap')) {
      direction = 'qty';
      newPdfTypeId = String(formData.pdf_type_id);
      newQuantity = "1";
    } else if (isBookFiziki && bookTypeName.includes('elektron')) {
      direction = 'fiziki';
      newPdfTypeId = herIkisiType ? String(herIkisiType.id) : String(formData.pdf_type_id);
      newQuantity = "1";
    } else {
      direction = 'elektron';
      newPdfTypeId = herIkisiType ? String(herIkisiType.id) : String(formData.pdf_type_id);
      newQuantity = "1";
    }

    const useBookInstId = (direction === 'elektron' || direction === 'ikisi-fiziki') && book.institution_id;
    const newInstId = useBookInstId
      ? String(book.institution_id)
      : (store.user.data?.institutionId ? String(store.user.data.institutionId) : null);

    setLinkedBookId(book.id);
    setLinkedDirection(direction);
    setLinkedBookQuantity(book.quantity || 1);
    setWarnSelected(false);
    setWarnSuggestions([]);
    setWarnPhysicalBook(null);
    setFormData(prev => ({
      ...prev,
      title: book.title || '',
      description: book.description || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publication_year: book.publication_year ? String(book.publication_year) : '',
      publisher_location: book.publisher_location || '',
      language: book.language || 'az',
      price: book.price !== undefined ? String(book.price) : '0',
      allow_download: book.allow_download !== undefined ? String(book.allow_download) : '1',
      quantity: newQuantity,
      pdf_type_id: newPdfTypeId,
      category_id: book.category_id ? String(book.category_id) : prev.category_id,
      coverImage: null,
      institution_id: newInstId || prev.institution_id,
    }));
    setTitleSuggestions([]);
  };

  const unlinkBook = () => {
    setLinkedBookId(null);
    setLinkedDirection(null);
    setLinkedBookQuantity(null);
    setWarnSelected(false);
    setWarnPhysicalBook(null);
    setFormData(prev => ({ ...prev, title: '', pdf_type_id: '', category_id: '', quantity: '1' }));
  };

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setFileError("Yalnız PDF faylı qəbul edilir"); return; }
    if (f.size > uploadLimitMb * 1024 * 1024) { setFileError(`Maksimum fayl ölçüsü ${uploadLimitMb} MB-dır`); return; }
    setFileError("");
    setFormData((prev) => ({ ...prev, file: f }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.title.trim()) { Swal.fire({ icon: "warning", title: "Xəta", text: "PDF adı tələb olunur", confirmButtonColor: "#0B1F3D" }); return false; }
      if (!formData.pdf_type_id) { Swal.fire({ icon: "warning", title: "Xəta", text: "PDF tipi seçilməlidir", confirmButtonColor: "#0B1F3D" }); return false; }
      if (!formData.category_id) { Swal.fire({ icon: "warning", title: "Xəta", text: "Kateqoriya seçilməlidir", confirmButtonColor: "#0B1F3D" }); return false; }
    }
    if (s === 2) {
      if ((isBookFiziki || isBookHerIkisi) && !formData.institution_id) {
        Swal.fire({ icon: "warning", title: "Xəta", text: "Kitabın saxlanıldığı müəssisəni seçin", confirmButtonColor: "#0B1F3D" });
        return false;
      }
    }
    if (s === 3) {
      if (!formData.file && !isBookFiziki && !(linkedBookId && (linkedDirection === 'fiziki' || linkedDirection === 'qty' || linkedDirection === 'ikisi-elektron'))) {
        Swal.fire({ icon: "warning", title: "Xəta", text: "PDF faylı seçin", confirmButtonColor: "#0B1F3D" });
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 4));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    data.append("pdf_type_id", formData.pdf_type_id);
    data.append("category_id", formData.category_id);
    data.append("allow_download", isBookFiziki ? "0" : formData.allow_download);
    if ((isBookFiziki || isBookHerIkisi) && formData.institution_id) data.append("institution_id", formData.institution_id);
    if ((isBookFiziki || isBookHerIkisi) && formData.shelf_number.trim()) data.append("shelf_number", formData.shelf_number.trim());
    if (formData.description.trim()) data.append("description", formData.description.trim());
    if (formData.table_of_contents.trim()) data.append("table_of_contents", formData.table_of_contents.trim());
    if (formData.author.trim()) data.append("author", formData.author.trim());
    if (isBookCategory && formData.isbn.trim()) data.append("isbn", formData.isbn.trim());
    if (isBookCategory && formData.publication_year) data.append("publication_year", formData.publication_year);
    if (isBookCategory && formData.publisher_location.trim()) data.append("publisher_location", formData.publisher_location.trim());
    if (isBookCategory && formData.foreword.trim()) data.append("foreword", formData.foreword.trim());
    if (!isBookElektron && formData.price !== "") data.append("price", formData.price);
    if (!isBookCategory && formData.order_number.trim()) data.append("order_number", formData.order_number.trim());
    if ((isBookFiziki || isBookHerIkisi || linkedDirection === 'qty') && formData.quantity)
      data.append("quantity", formData.quantity);
    if (formData.file) data.append("file", formData.file);
    if (formData.coverImage) data.append("coverImage", formData.coverImage);
    if (linkedBookId) data.append("linked_pdf_id", linkedBookId);

    try {
      setLoader(true);

      // Fiziki/hər-ikisi warning: heç dəyişiklik yoxdursa — say artırma sorğusu
      if (warnPhysicalBook && !hasChangedFromWarning()) {
        const qtyData = new FormData();
        qtyData.append("title", warnPhysicalBook.title || '');
        qtyData.append("pdf_type_id", formData.pdf_type_id);
        qtyData.append("category_id", formData.category_id);
        qtyData.append("language", formData.language);
        qtyData.append("linked_pdf_id", warnPhysicalBook.id);
        qtyData.append("quantity", formData.quantity || '1');
        if (formData.institution_id) qtyData.append("institution_id", formData.institution_id);
        await axios.post(Base_Url_Server + "pdfs/submit", qtyData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const isPending = store.user.data?.uploadPermission === "pending";
        await Swal.fire({
          icon: "success", title: "Uğurlu!",
          text: isPending
            ? `Sorğunuz göndərildi. Admin təsdiq etdikdən sonra kitab sayı ${formData.quantity} vahid artırılacaq.`
            : `Kitab sayı ${formData.quantity} vahid artırıldı.`,
          confirmButtonColor: "#0B1F3D",
        });
        navigate("/library/all");
        return;
      }

      await axios.post(Base_Url_Server + "pdfs/submit", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const linkMsg = linkedDirection === 'qty'
        ? `Sorğunuz göndərildi. Admin təsdiq etdikdən sonra kitab sayı ${formData.quantity} vahid artırılacaq.`
        : linkedDirection === 'fiziki'
        ? "Sorğunuz göndərildi. Admin təsdiq etdikdən sonra mövcud elektron kitab fiziki nüsxə ilə əlaqələndiriləcək."
        : linkedDirection === 'elektron'
        ? "Sorğunuz göndərildi. Admin təsdiq etdikdən sonra mövcud fiziki kitaba elektron versiya əlavə ediləcək."
        : linkedDirection === 'ikisi-fiziki'
        ? "Sorğunuz göndərildi. Admin təsdiq etdikdən sonra fiziki kitab elektron faylı ilə birləşdiriləcək."
        : linkedDirection === 'ikisi-elektron'
        ? "Sorğunuz göndərildi. Admin təsdiq etdikdən sonra elektron kitab kitab-hər ikisi kateqoriyasına keçiriləcək."
        : null;

      const isPending = store.user.data?.uploadPermission === "pending";
      await Swal.fire({
        icon: "success", title: "Uğurlu!",
        text: linkMsg || (isPending
          ? "PDF uğurla yükləndi. Admin təsdiqlədikdən sonra kitabxanada görünəcək."
          : "PDF uğurla yükləndi və kitabxanaya əlavə edildi."),
        confirmButtonColor: "#0B1F3D",
      });
      navigate("/library/all");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err.response?.data?.message || "Xəta baş verdi", confirmButtonColor: "#0B1F3D" });
    } finally {
      setLoader(false);
    }
  };

  const [c1, c2] = PALETTES[1];

  return (
    <>
      <main>
        {/* ── Hero strip ── */}
        <section className={styles.heroStrip}>
          <div className="mmu-container">
            <span className="mmu-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
              PDF Yüklə
            </span>
            <h1 className={styles.heroTitle}>Kitabxanaya töhfə verin</h1>
            <p className="mmu-lead">Sənədinizi yükləyin — bir neçə addım, işiniz bitdi.</p>
          </div>
        </section>

        {/* ── Stepper ── */}
        <div className={styles.stepperBar}>
          <div className="mmu-container">
            <div className={styles.stepper}>
              {STEPS.map((s, i) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <div key={s.n} className={styles.stepItem}>
                    {i > 0 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ""}`} />}
                    <div className={`${styles.stepCircle} ${active ? styles.stepCircleActive : ""} ${done ? styles.stepCircleDone : ""}`}>
                      {done ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : s.n}
                    </div>
                    <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ""}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Form area ── */}
        <section className={styles.formSection}>
          <div className="mmu-container">
            <div className={styles.layout}>

              {/* Main form */}
              <div className={styles.formWrap}>

                {/* Step 1 */}
                {step === 1 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Əsas məlumat</h2>

                    <div className={styles.field}>
                      <label className={styles.label}>
                        PDF Adı <span className={styles.req}>*</span>
                      </label>
                      <div className={styles.titleWrap}>
                        <input
                          className="mmu-input"
                          name="title" type="text"
                          placeholder="PDF-in adını daxil edin"
                          value={formData.title}
                          autoComplete="off"
                          readOnly={!!linkedBookId}
                          style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                          onChange={(e) => {
                            if (linkedBookId) return;
                            handleChange(e);
                            setWarnSelected(false);
                            setWarnPhysicalBook(null);
                            if (isBookFiziki || isBookElektron || isBookHerIkisi) {
                              setLinkedBookId(null);
                              setLinkedDirection(null);
                              clearTimeout(debounceRef.current);
                              clearTimeout(warnDebounceRef.current);
                              const q = e.target.value.trim();
                              if (q.length >= 2) {
                                const userInstId = store.user.data?.institutionId || null;
                                if (isBookFiziki) {
                                  const instId = formData.institution_id || userInstId || null;
                                  debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null, true), 350);
                                  warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
                                } else if (isBookElektron) {
                                  debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'fiziki', null, true), 350);
                                  warnDebounceRef.current = setTimeout(() => searchElektronDuplicates(q), 350);
                                } else {
                                  const instId = formData.institution_id || userInstId || null;
                                  debounceRef.current = setTimeout(() => searchSimilarBooks(q, null, instId), 350);
                                  warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
                                }
                              } else {
                                setTitleSuggestions([]);
                                setWarnSuggestions([]);
                              }
                            }
                          }}
                          onBlur={() => setTimeout(() => setTitleSuggestions([]), 200)}
                        />
                        {titleSuggestions && titleSuggestions.length > 0 && (
                          <ul className={styles.suggestions}>
                            {titleSuggestions.map(book => (
                              <li key={book.id} onMouseDown={() => selectSuggestion(book)}>
                                <span className={styles.suggTitle}>{book.title}</span>
                                <span className={styles.suggMeta}>
                                  {(book.pdf_type?.name || book.category?.name) && <span className={styles.suggCat}>{book.pdf_type?.name || book.category?.name}</span>}
                                  {book.institution_name && <span className={styles.suggInst}>{book.institution_name}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {warnSuggestions.length > 0 && (
                        <div className={styles.warnSection}>
                          <div className={styles.warnSectionHeader}>
                            ⚠️ Bu adda kitab artıq mövcuddur. Seçib məlumatlarına baxa bilərsiniz:
                          </div>
                          {warnSuggestions.map(book => (
                            <div key={book.id} className={styles.warnCard} onClick={() => selectWarnBook(book)}>
                              <span className={styles.warnTitle}>{book.title}</span>
                              <span className={styles.warnCardMeta}>
                                {book.author && <span>{book.author}</span>}
                                {book.institution_name && <span>{book.institution_name}</span>}
                                <span>{book.pdf_type?.name || book.category?.name} · Say: {book.quantity || 1}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {warnSelected && !linkedBookId && (
                        <div className={styles.warnBadge}>
                          {warnPhysicalBook
                            ? "⚠️ Mövcud kitab seçildi. Dəyişiklik etmədən göndərərsinizsə, say artırılacaq; dəyişiklik etsəniz, yeni kitab olaraq əlavə ediləcək."
                            : "⚠️ Bu adda kitab artıq mövcuddur. Məlumatları dəyişdirib yeni kitab kimi göndərə bilərsiniz."
                          }
                          <button type="button" style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#b45309' }}
                            onClick={() => { setWarnSelected(false); setWarnPhysicalBook(null); }}>✕</button>
                        </div>
                      )}
                      {linkedBookId && (
                        <div className={styles.linkedBadge}>
                          {linkedDirection === 'qty'
                            ? `Mövcud kitab seçildi — cari say: ${linkedBookQuantity}`
                            : linkedDirection === 'elektron'
                            ? "Mövcud fiziki kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi"
                            : linkedDirection === 'ikisi-fiziki'
                            ? "Mövcud fiziki kitabla əlaqələndirildi — elektron faylı yükləyin, kateqoriya kitab-hər ikisi olacaq"
                            : linkedDirection === 'ikisi-elektron'
                            ? "Mövcud elektron kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi olacaq, fayl tələb olunmur"
                            : "Mövcud elektron kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi"
                          }
                          <button type="button" onClick={unlinkBook}>✕</button>
                        </div>
                      )}
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          PDF Tipi <span className={styles.req}>*</span>
                        </label>
                        <select
                          className="mmu-input mmu-select"
                          name="pdf_type_id"
                          value={formData.pdf_type_id}
                          onChange={handleChange}
                          required
                          disabled={!!linkedBookId}
                          style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                        >
                          <option value="">— Seçin —</option>
                          {visibleTypes.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Kateqoriya <span className={styles.req}>*</span>
                        </label>
                        <select
                          className="mmu-input mmu-select"
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleChange}
                          disabled={!!linkedBookId}
                          style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                        >
                          <option value="">— Seçin —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>Dil <span className={styles.req}>*</span></label>
                        <select
                          className="mmu-input mmu-select"
                          name="language"
                          value={formData.language} onChange={handleChange}
                          disabled={!!linkedBookId}
                          style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                        >
                          {languages.map((l) => (
                            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>Müəllif</label>
                        <input
                          className="mmu-input"
                          name="author" type="text"
                          placeholder="Müəllifin adı"
                          value={formData.author} onChange={handleChange}
                          readOnly={!!linkedBookId}
                          style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                        />
                      </div>
                      {!isBookCategory && (
                        <div className={styles.field}>
                          <label className={styles.label}>Nömrə / Sıra №</label>
                          <input
                            className="mmu-input"
                            name="order_number" type="text"
                            placeholder="Məs: 45/2025"
                            value={formData.order_number} onChange={handleChange}
                          />
                        </div>
                      )}
                    </div>

                    {(isBookFiziki || isBookHerIkisi) && linkedDirection !== 'fiziki' && linkedDirection !== 'elektron' && linkedDirection !== 'ikisi-elektron' && (
                      <div className={styles.field} style={{ maxWidth: 200 }}>
                        <label className={styles.label}>
                          {linkedDirection === 'qty' ? 'Əlavə ediləcək say' : 'Say (nüsxə)'}
                        </label>
                        <input
                          className="mmu-input"
                          name="quantity"
                          type="number"
                          min={1}
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="1"
                        />
                        {linkedDirection === 'qty' && linkedBookQuantity !== null && (
                          <span className={styles.hint}>Cari: {linkedBookQuantity} → yeni: {linkedBookQuantity + (parseInt(formData.quantity) || 1)}</span>
                        )}
                      </div>
                    )}

                    {(isBookFiziki || isBookHerIkisi) && (
                      <div className={styles.field} style={{ maxWidth: 260 }}>
                        <label className={styles.label}>Rəf № <span className={styles.hint}>(istəyə bağlı)</span></label>
                        <input
                          className="mmu-input"
                          name="shelf_number"
                          type="text"
                          placeholder="Məs: A-12"
                          value={formData.shelf_number}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    {(isBookFiziki || isBookHerIkisi) && (
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Müəssisə (kitabın saxlanıldığı yer) <span className={styles.req}>*</span>
                        </label>
                        <select
                          className="mmu-input mmu-select"
                          name="institution_id"
                          value={formData.institution_id} onChange={handleChange}
                        >
                          <option value="">— Müəssisə seçin —</option>
                          {institutions.map((inst) => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Ətraflı məlumat</h2>

                    <div className={styles.field}>
                      <label className={styles.label}>Təsvir</label>
                      <textarea
                        className="mmu-input"
                        name="description"
                        placeholder="PDF haqqında qısa məlumat"
                        value={formData.description} onChange={handleChange} rows={4}
                        readOnly={!!linkedBookId}
                        style={{ resize: "vertical", ...(linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : {}) }}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Mündəricat</label>
                      <textarea
                        className="mmu-input"
                        name="table_of_contents"
                        placeholder="Mündericatı buraya yapışdırın…"
                        value={formData.table_of_contents} onChange={handleChange}
                        rows={5}
                        style={{ fontFamily: "monospace", fontSize: "13px", resize: "vertical" }}
                      />
                    </div>

                    {isBookCategory && (
                      <>
                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label className={styles.label}>ISBN</label>
                            <input
                              className="mmu-input"
                              name="isbn" type="text"
                              placeholder="978-9952-8283-0-1"
                              value={formData.isbn} onChange={handleChange} maxLength={20}
                              readOnly={!!linkedBookId}
                              style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>Nəşr ili</label>
                            <input
                              className="mmu-input"
                              name="publication_year" type="number"
                              placeholder="Məs: 2023"
                              value={formData.publication_year} onChange={handleChange}
                              min={1900} max={new Date().getFullYear()}
                              readOnly={!!linkedBookId}
                              style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                            />
                          </div>
                        </div>

                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label className={styles.label}>Nəşriyyat yeri</label>
                            <input
                              className="mmu-input"
                              name="publisher_location" type="text"
                              placeholder="Məs: Bakı"
                              value={formData.publisher_location} onChange={handleChange}
                              readOnly={!!linkedBookId}
                              style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                            />
                          </div>
                          {!isBookElektron && (
                            <div className={styles.field}>
                              <label className={styles.label}>Qiymət (AZN)</label>
                              <input
                                className="mmu-input"
                                name="price" type="number"
                                placeholder="0 — pulsuz"
                                value={formData.price} onChange={handleChange}
                                min={0} step="0.01"
                                readOnly={!!linkedBookId}
                                style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                              />
                            </div>
                          )}
                        </div>

                        {!isBookFiziki && (
                          <div className={styles.field}>
                            <label className={styles.label}>Yükləməyə icazə</label>
                            <select
                              className="mmu-input mmu-select"
                              name="allow_download"
                              value={formData.allow_download} onChange={handleChange}
                              disabled={!!linkedBookId}
                              style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                            >
                              <option value="1">İcazə var</option>
                              <option value="0">İcazə yoxdur</option>
                            </select>
                          </div>
                        )}

                        <div className={styles.field}>
                          <label className={styles.label}>Ön söz <span className={styles.hint}>(istəyə bağlı)</span></label>
                          <textarea
                            className="mmu-input"
                            name="foreword"
                            placeholder="Kitabın ön sözünü buraya daxil edin…"
                            value={formData.foreword} onChange={handleChange}
                            rows={4}
                            style={{ resize: "vertical" }}
                          />
                        </div>
                      </>
                    )}

                    {!isBookCategory && (
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label className={styles.label}>Qiymət (AZN)</label>
                          <input
                            className="mmu-input"
                            name="price" type="number"
                            placeholder="0 — pulsuz"
                            value={formData.price} onChange={handleChange}
                            min={0} step="0.01"
                            readOnly={!!linkedBookId}
                            style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Yükləməyə icazə</label>
                          <select
                            className="mmu-input mmu-select"
                            name="allow_download"
                            value={formData.allow_download} onChange={handleChange}
                            disabled={!!linkedBookId}
                            style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}
                          >
                            <option value="1">İcazə var</option>
                            <option value="0">İcazə yoxdur</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Fayllar</h2>

                    {!isBookFiziki && !(linkedBookId && (linkedDirection === 'fiziki' || linkedDirection === 'qty' || linkedDirection === 'ikisi-elektron')) && (
                      <div className={styles.field}>
                        <label className={styles.label}>
                          PDF Faylı <span className={styles.req}>*</span>
                        </label>
                        <div
                          className={`${styles.dropZone} ${dragOver ? styles.dragActive : ""} ${formData.file ? styles.hasFile : ""}`}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById("pdfFileInput").click()}
                        >
                          <input
                            id="pdfFileInput" type="file" accept="application/pdf"
                            onChange={(e) => validateAndSetFile(e.target.files[0])}
                            style={{ display: "none" }}
                          />
                          {formData.file ? (
                            <div className={styles.fileSelected}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <div>
                                <div className={styles.fileName}>{formData.file.name}</div>
                                <div className={styles.fileSize}>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.dropZoneContent}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <p>Sürükləyin və ya <strong>seçin</strong></p>
                              <small>Maks. {uploadLimitMb} MB · PDF</small>
                            </div>
                          )}
                        </div>
                        {fileError && <span className={styles.fieldError}>{fileError}</span>}
                      </div>
                    )}

                    <div className={styles.field}>
                      <label className={styles.label}>Üz qabığı şəkli <span className={styles.hint}>(istəyə bağlı)</span></label>
                      <div
                        className={`${styles.dropZone} ${formData.coverImage ? styles.hasFile : ""}`}
                        onClick={() => document.getElementById("coverInput").click()}
                        style={{ minHeight: 110 }}
                      >
                        <input
                          id="coverInput" type="file" accept="image/*"
                          onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.files[0] || null }))}
                          style={{ display: "none" }}
                        />
                        {formData.coverImage ? (
                          <div className={styles.fileSelected}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <div>
                              <div className={styles.fileName}>{formData.coverImage.name}</div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.dropZoneContent}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <p>Şəkil seçin <strong>(istəyə bağlı)</strong></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Review */}
                {step === 4 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Yoxla &amp; Göndər</h2>
                    {linkedBookId && (
                      <div style={{ background: '#e8f8ee', border: '1px solid #a3d9b1', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1a7a3a' }}>
                        {linkedDirection === 'qty'
                          ? `Bu sorğu kitab sayını ${formData.quantity} vahid artıracaq.`
                          : linkedDirection === 'elektron'
                          ? "Bu sorğu mövcud fiziki kitaba elektron versiya əlavə edəcək."
                          : linkedDirection === 'fiziki'
                          ? "Bu sorğu mövcud elektron kitabı fiziki nüsxə ilə əlaqələndirəcək."
                          : linkedDirection === 'ikisi-fiziki'
                          ? "Bu sorğu fiziki kitabı elektron faylı ilə birləşdirərək kitab-hər ikisi kateqoriyasına keçirəcək."
                          : linkedDirection === 'ikisi-elektron'
                          ? "Bu sorğu elektron kitabı kitab-hər ikisi kateqoriyasına keçirəcək."
                          : "Bu sorğu mövcud kitabla əlaqələndiriləcək."
                        } Admin təsdiq etdikdən sonra aktiv olacaq.
                      </div>
                    )}
                    <div className={styles.reviewGrid}>
                      {[
                        { l: "Başlıq",       v: formData.title },
                        { l: "PDF Tipi",     v: selectedType?.name },
                        { l: "Kateqoriya",   v: categories.find(c => String(c.id) === String(formData.category_id))?.name },
                        { l: "Dil",          v: formData.language },
                        { l: "Müəllif",      v: formData.author },
                        { l: "Rəf №",        v: formData.shelf_number },
                        { l: "Nəşr ili",     v: formData.publication_year },
                        { l: "ISBN",         v: formData.isbn },
                        { l: "Qiymət",       v: formData.price ? `${formData.price} AZN` : "Pulsuz" },
                        { l: "PDF faylı",    v: formData.file?.name },
                        { l: "Üz qabığı",    v: formData.coverImage?.name },
                      ].filter(item => item.v).map(({ l, v }) => (
                        <div key={l} className={styles.reviewRow}>
                          <span className={styles.reviewKey}>{l}</span>
                          <span className={styles.reviewVal}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {formData.description && (
                      <div className={styles.reviewDesc}>
                        <p className={styles.reviewKey}>Təsvir</p>
                        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 6 }}>{formData.description}</p>
                      </div>
                    )}

                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmit}
                      disabled={loader}
                    >
                      {loader ? (
                        <>
                          <span className={styles.btnSpinner} />
                          Yüklənir…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
                          PDF-i Kitabxanaya Göndər
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className={styles.navRow}>
                  {step > 1 && (
                    <button
                      className="mmu-btn mmu-btn-outline"
                      onClick={() => setStep(s => s - 1)}
                    >
                      ← Geri
                    </button>
                  )}
                  {step < 4 && (
                    <button
                      className="mmu-btn mmu-btn-primary"
                      style={{ marginLeft: "auto" }}
                      onClick={goNext}
                    >
                      İrəli →
                    </button>
                  )}
                </div>
              </div>

              {/* Preview sidebar */}
              <aside className={styles.preview}>
                <p className={styles.previewLabel}>Canlı önbaxış</p>
                <div className={styles.previewCover}>
                  {coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="Üz qabığı" />
                  ) : (
                    <div
                      className={styles.previewGradient}
                      style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
                    >
                      <span className={styles.previewTitle}>{formData.title || "PDF adı"}</span>
                      {formData.author && <span className={styles.previewAuthor}>{formData.author}</span>}
                    </div>
                  )}
                </div>
                <div className={styles.previewMeta}>
                  <strong>{formData.title || "—"}</strong>
                  {formData.author && <span>{formData.author}</span>}
                  {selectedCatName && <span className="mmu-badge mmu-badge-accent" style={{ marginTop: 6 }}>{selectedCatName}</span>}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default UserSubmitPdfPage;
