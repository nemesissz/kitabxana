import { useContext, useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useLanguages } from "../../Hooks/useLanguages";

function AddBookPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [pdfsTypes, setPdfsTypes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [linkedBookId, setLinkedBookId] = useState(null);
  const [linkedDirection, setLinkedDirection] = useState(null); // 'fiziki' | 'elektron' | 'qty' | null
  const [linkedBookQuantity, setLinkedBookQuantity] = useState(null);
  const [warnSuggestions, setWarnSuggestions] = useState([]);
  const [warnSelected, setWarnSelected] = useState(false);
  const [warnPhysicalBook, setWarnPhysicalBook] = useState(null);
  const debounceRef = useRef(null);
  const warnDebounceRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    table_of_contents: "",
    author: "",
    isbn: "",
    publication_year: "",
    publisher_location: "",
    order_number: "",
    shelf_number: "",
    price: "",
    allow_download: "1",
    language: "az",
    pdf_type_id: "",
    categoryId: "",
    institution_id: "",
    foreword: "",
    quantity: "1",
    file: null,
    coverImage: null,
  });

  const { languages } = useLanguages();

  const adminData = store.admin.data;
  const adminRole = adminData?.role ?? 0;
  const adminInstId = adminData?.institutionId ?? null;
  const adminInst = institutions.find(i => i.id === adminInstId);
  const isNonMain = adminRole < 4 && !!adminInstId && institutions.length > 0 && !adminInst?.is_main;
  const uploadPermission = adminData?.uploadPermission || 'pending';

  const selectedType = pdfsTypes.find(t => String(t.id) === String(formData.pdf_type_id));
  const typeName = (selectedType?.name || '').toLowerCase();
  const isBookHerIkisi = typeName.includes('çap') && typeName.includes('elektron');
  const isBookElektron = typeName.includes('elektron') && !isBookHerIkisi;
  const isBookFiziki   = typeName.includes('çap') && !isBookHerIkisi;
  const isBookCategory = isBookElektron || isBookFiziki || isBookHerIkisi;
  const visibleTypes = (adminRole === 2 && adminData?.workerType)
    ? pdfsTypes.filter(t => {
        const n = (t.name || '').toLowerCase();
        if (n.includes('çap') && n.includes('elektron')) return false;
        if (adminData.workerType === 'elektron') return n.includes('elektron');
        if (adminData.workerType === 'fiziki') return n.includes('çap');
        return true;
      })
    : pdfsTypes;

  const handleChange = (e) => {
    if (e.target.name === 'pdf_type_id') {
      setTitleSuggestions([]);
      setWarnSuggestions([]);
      setWarnSelected(false);
      setLinkedBookId(null);
      setLinkedDirection(null);
      const selectedT = pdfsTypes.find(t => String(t.id) === String(e.target.value));
      const newTypeName = (selectedT?.name || '').toLowerCase();
      const newIsBookHerIkisi = newTypeName.includes('çap') && newTypeName.includes('elektron');
      const needsInst = newTypeName.includes('çap');
      setFormData(prev => ({
        ...prev,
        pdf_type_id: e.target.value,
        institution_id: needsInst && adminInstId ? String(adminInstId) : prev.institution_id,
      }));
      const q = formData.title.trim();
      const newIsBookFiziki   = newTypeName.includes('çap') && !newIsBookHerIkisi;
      const newIsBookElektron = newTypeName.includes('elektron') && !newIsBookHerIkisi;
      if (q.length >= 2 && (newIsBookFiziki || newIsBookElektron || newIsBookHerIkisi)) {
        clearTimeout(debounceRef.current);
        clearTimeout(warnDebounceRef.current);
        const instId = formData.institution_id || adminInstId || null;
        if (newIsBookFiziki) {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null), 350);
          warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
        } else if (newIsBookElektron) {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'fiziki', null), 350);
          warnDebounceRef.current = setTimeout(() => searchElektronDuplicates(q), 350);
        } else {
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
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null), 350);
        } else {
          debounceRef.current = setTimeout(() => searchSimilarBooks(q, null, newInstId), 350);
        }
        warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, newInstId), 350);
      }
    }
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const searchSimilarBooks = async (q, lookInType, instId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const params = { search: q, limit: 8, status: 'approved' };
      if (lookInType) {
        const targetType = pdfsTypes.find(t => (t.name || '').toLowerCase().includes(lookInType));
        if (targetType) params.pdfTypeId = targetType.id;
      }
      if (formData.categoryId) params.categoryId = formData.categoryId;
      if (instId) params.anyInstId = instId;
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setTitleSuggestions(res.data.data.pdfs || []);
    } catch {
      setTitleSuggestions([]);
    }
  };

  const searchElektronDuplicates = async (q) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const elektronType = pdfsTypes.find(t => {
        const n = (t.name || '').toLowerCase();
        return n.includes('elektron') && !n.includes('çap');
      });
      if (!elektronType) return;
      const params = { search: q, limit: 5, status: 'approved', pdfTypeId: elektronType.id };
      if (formData.categoryId) params.categoryId = formData.categoryId;
      if (adminInstId) {
        params.anyInstId = adminInstId;
      } else {
        params.uploaderNoInst = 1;
      }
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setWarnSuggestions(res.data.data.pdfs || []);
    } catch {
      setWarnSuggestions([]);
    }
  };

  const searchFizikiDuplicates = async (q, instId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const params = { search: q, limit: 5, status: 'approved' };
      if (formData.categoryId) params.categoryId = formData.categoryId;
      if (instId) params.anyInstId = instId;
      const res = await axios.get(`${Base_Url_Server}pdfs`, {
        params,
        headers: { Authorization: `Bearer ${tokenAdmin}` },
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
        newQuantity = String((book.quantity || 1) + 1);
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

    const newInstId = (direction === 'ikisi-fiziki' || direction === 'qty' || direction === 'elektron') && book.institution_id
      ? String(book.institution_id)
      : (adminInstId ? String(adminInstId) : null);

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
      categoryId: book.category_id ? String(book.category_id) : prev.categoryId,
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
    setFormData(prev => ({ ...prev, title: '', pdf_type_id: '', categoryId: '', quantity: '1' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    if (!tokenAdmin) { navigate("/admin/login"); return; }

    if (!formData.title.trim()) return Swal.fire("Xəta", "Başlıq tələb olunur", "error");
    if (!formData.pdf_type_id) return Swal.fire("Xəta", "PDF tipi seçilməlidir", "error");
    if (!formData.categoryId) return Swal.fire("Xəta", "Kateqoriya seçilməlidir", "error");
    if ((isBookFiziki || isBookHerIkisi) && !formData.institution_id)
      return Swal.fire("Xəta", "Kitabın saxlanıldığı müəssisəni seçin", "error");
    if (!formData.file && !isBookFiziki && !(linkedBookId && (linkedDirection === 'fiziki' || linkedDirection === 'qty' || linkedDirection === 'ikisi-elektron')))
      return Swal.fire("Xəta", "PDF faylı seçin", "error");

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    data.append("pdf_type_id", formData.pdf_type_id);
    // createPdf uses "categoryId"; submitPdf uses "category_id"
    data.append(isNonMain ? "category_id" : "categoryId", formData.categoryId);
    data.append("allow_download", isBookFiziki ? "0" : formData.allow_download);
    if ((isBookFiziki || isBookHerIkisi) && formData.institution_id)
      data.append("institution_id", formData.institution_id);
    if ((isBookFiziki || isBookHerIkisi) && formData.shelf_number.trim())
      data.append("shelf_number", formData.shelf_number.trim());
    if (formData.description.trim()) data.append("description", formData.description.trim());
    if (formData.table_of_contents.trim()) data.append("table_of_contents", formData.table_of_contents.trim());
    if (formData.author.trim()) data.append("author", formData.author.trim());
    if (isBookCategory && formData.isbn.trim()) data.append("isbn", formData.isbn.trim());
    if (isBookCategory && formData.publication_year) data.append("publication_year", formData.publication_year);
    if (isBookCategory && formData.publisher_location.trim()) data.append("publisher_location", formData.publisher_location.trim());
    if (isBookCategory && formData.foreword.trim()) data.append("foreword", formData.foreword.trim());
    if ((!isBookCategory || isBookFiziki || isBookHerIkisi) && formData.order_number.trim()) data.append("order_number", formData.order_number.trim());
    if (!isBookElektron && formData.price !== "") data.append("price", formData.price);
    if ((isBookFiziki || isBookHerIkisi) && formData.quantity) data.append("quantity", formData.quantity);
    if (formData.file) data.append("file", formData.file);
    if (formData.coverImage) data.append("coverImage", formData.coverImage);

    try {
      setLoader(true);

      // Fiziki/hər-ikisi warning: heç dəyişiklik yoxdursa — say artır
      if (warnPhysicalBook && !hasChangedFromWarning()) {
        const newQty = (parseInt(warnPhysicalBook.quantity) || 1) + (parseInt(formData.quantity) || 1);
        await axios.put(`${Base_Url_Server}pdfs/${warnPhysicalBook.id}`,
          { quantity: newQty },
          { headers: { Authorization: `Bearer ${tokenAdmin}` } }
        );
        Swal.fire({ icon: "success", title: "Uğurlu!", text: `Kitab sayı ${formData.quantity} vahid artırıldı.`, showConfirmButton: false, timer: 1800 });
        setTimeout(() => navigate("/admin/library"), 1800);
        return;
      }

      if (linkedBookId && linkedDirection === 'qty') {
        // Say artırma: yalnız quantity göndər
        await axios.put(`${Base_Url_Server}pdfs/${linkedBookId}`,
          { quantity: parseInt(formData.quantity) + (linkedBookQuantity || 0) },
          { headers: { Authorization: `Bearer ${tokenAdmin}` } }
        );
        Swal.fire({ icon: "success", title: "Uğurlu!", text: `Kitab sayı ${formData.quantity} vahid artırıldı.`, showConfirmButton: false, timer: 1800 });
        setTimeout(() => navigate("/admin/library"), 1800);
      } else if (linkedBookId && linkedDirection === 'ikisi-elektron') {
        // Yalnız tip dəyiş — elektron kitab hər-ikisiyə çevrilir
        await axios.put(`${Base_Url_Server}pdfs/${linkedBookId}`,
          { pdf_type_id: formData.pdf_type_id },
          { headers: { Authorization: `Bearer ${tokenAdmin}` } }
        );
        Swal.fire({ icon: "success", title: "Uğurlu!", text: "Elektron kitab kitab-hər ikisi kateqoriyasına keçirildi.", showConfirmButton: false, timer: 1800 });
        setTimeout(() => navigate("/admin/library"), 1800);
      } else if (linkedBookId) {
        // Mövcud kitabı güncəllə (elektron, fiziki, ikisi-fiziki)
        await axios.put(`${Base_Url_Server}pdfs/${linkedBookId}`, data, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${tokenAdmin}` },
        });
        const linkText = linkedDirection === 'elektron'
          ? "Fiziki kitaba elektron versiya əlavə edildi — kateqoriya kitab-hər ikisi oldu."
          : linkedDirection === 'ikisi-fiziki'
          ? "Fiziki kitab elektron faylı ilə birləşdirildi — kateqoriya kitab-hər ikisi oldu."
          : "Kitab fiziki nüsxə ilə əlaqələndirildi.";
        Swal.fire({ icon: "success", title: "Uğurlu!", text: linkText, showConfirmButton: false, timer: 1800 });
        setTimeout(() => navigate("/admin/library"), 1800);
      } else {
        const endpoint = isNonMain ? `${Base_Url_Server}pdfs/submit` : `${Base_Url_Server}pdfs`;
        await axios.post(endpoint, data, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${tokenAdmin}` },
        });
        const showAsRequest = isNonMain && uploadPermission === 'pending';
        if (showAsRequest) {
          Swal.fire({ icon: "success", title: "Sorğu göndərildi!", text: "Sorğunuz admin tərəfindən nəzərdən keçiriləcək.", showConfirmButton: false, timer: 2000 });
        } else {
          Swal.fire({ icon: "success", title: "Uğurlu!", text: "PDF uğurla əlavə edildi.", showConfirmButton: false, timer: 1500 });
        }
        setTimeout(() => navigate("/admin/library"), showAsRequest ? 2000 : 1500);
      }
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Əlavə etmə zamanı xəta baş verdi.", "error");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { store.admin.setData(null); navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(r => store.admin.setData(r.data.data.user))
      .catch(err => { if (err.response?.status === 401) { navigate("/admin/login"); } });
  }, []);

  useEffect(() => {
    axios.get(`${Base_Url_Server}pdfs-types`)
      .then(res => {
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
    axios.get(`${Base_Url_Server}categories/pdfs`)
      .then(res => {
        const all = res.data.data.categories || [];
        setAllCategories(all);
        setCategories(all);
      })
      .catch(() => {});
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(`${Base_Url_Server}institutions`, { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then(res => setInstitutions(res.data.data.institutions || []))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.addBookPage}>
      <div className={styles.addBook}>
        <h2>Yeni PDF Əlavə Et</h2>
        {isNonMain && uploadPermission === 'none' && (
          <div className={styles.infoBanner} style={{ background: '#fee2e2', borderColor: '#ef4444', color: '#dc2626' }}>
            ⛔ PDF yükləmə icazəniz yoxdur. Sistem inzibatçısı ilə əlaqə saxlayın.
          </div>
        )}
        {isNonMain && uploadPermission === 'pending' && (
          <div className={styles.infoBanner}>
            ℹ️ Müəssisəniz birbaşa PDF əlavə etməyə icazəli deyil. Forma göndərildikdə sorğu kimi qeydə alınacaq və admin tərəfindən nəzərdən keçiriləcək.
          </div>
        )}
        {isNonMain && uploadPermission === 'free' && (
          <div className={styles.infoBanner} style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#166534' }}>
            ✅ Birbaşa PDF yükləmə icazəniz var. Yüklədiyiniz PDF-lər dərhal əlavə olunacaq.
          </div>
        )}
        {isNonMain && uploadPermission === 'none' ? null : (
        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Başlıq — tam en */}
          <div className={styles.formGroup}>
            <label>Başlıq <span className={styles.required}>*</span></label>
            <div className={styles.titleWrap}>
              <input
                type="text"
                name="title"
                value={formData.title}
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
                      const instId = formData.institution_id || adminInstId || null;
                      if (isBookFiziki) {
                        debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'elektron', null), 350);
                        warnDebounceRef.current = setTimeout(() => searchFizikiDuplicates(q, instId), 350);
                      } else if (isBookElektron) {
                        debounceRef.current = setTimeout(() => searchSimilarBooks(q, 'fiziki', null), 350);
                        warnDebounceRef.current = setTimeout(() => searchElektronDuplicates(q), 350);
                      } else {
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
                placeholder="PDF adını daxil edin"
                required
                autoComplete="off"
              />
              {titleSuggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {titleSuggestions.map(book => (
                    <li key={book.id} onMouseDown={() => selectSuggestion(book)}>
                      <span className={styles.suggTitle}>{book.title}</span>
                      {(book.pdf_type?.name || book.category?.name) && (
                        <span className={styles.suggCat}>
                          {[book.pdf_type?.name, book.category?.name].filter(Boolean).join(' · ')}
                        </span>
                      )}
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
                      <span>{[book.pdf_type?.name, book.category?.name].filter(Boolean).join(' · ')} · Say: {book.quantity || 1}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {warnSelected && !linkedBookId && (
              <div className={styles.warnBadge} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>
                  {warnPhysicalBook
                    ? "⚠️ Mövcud kitab seçildi. Dəyişiklik etmədən göndərərsinizsə, say artırılacaq; dəyişiklik etsəniz, yeni kitab olaraq əlavə ediləcək."
                    : "⚠️ Bu adda kitab artıq mövcuddur. Məlumatları dəyişdirib yeni kitab kimi əlavə edə bilərsiniz."
                  }
                </span>
                <button type="button" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontSize: 14 }}
                  onClick={() => { setWarnSelected(false); setWarnPhysicalBook(null); }}>✕</button>
              </div>
            )}
            {linkedBookId && (
              <div className={styles.linkedBadge}>
                {linkedDirection === 'qty'
                  ? `Mövcud kitab seçildi — cari say: ${linkedBookQuantity}. Artırma miqdarını daxil edin`
                  : linkedDirection === 'elektron'
                  ? "Mövcud fiziki kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi seçildi"
                  : linkedDirection === 'ikisi-fiziki'
                  ? "Mövcud fiziki kitabla əlaqələndirildi — elektron faylı yükləyin, kateqoriya kitab-hər ikisi olacaq"
                  : linkedDirection === 'ikisi-elektron'
                  ? "Mövcud elektron kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi olacaq, fayl tələb olunmur"
                  : "Mövcud elektron kitabla əlaqələndirildi — kateqoriya kitab-hər ikisi seçildi"
                }
                <button type="button" onClick={unlinkBook}>✕</button>
              </div>
            )}
          </div>

          {/* PDF Tipi + Kateqoriya */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>PDF Tipi <span className={styles.required}>*</span></label>
              <select name="pdf_type_id" value={formData.pdf_type_id} onChange={handleChange} required disabled={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}>
                <option value="">— Seçin —</option>
                {visibleTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Kateqoriya <span className={styles.required}>*</span></label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}>
                <option value="">— Seçin —</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          {/* Dil */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Dil <span className={styles.required}>*</span></label>
              <select name="language" value={formData.language} onChange={handleChange} disabled={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}>
                {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Rəf № — fiziki/hər ikisi kateqoriyasında */}
          {(isBookFiziki || isBookHerIkisi) && (
            <div className={styles.formGroup} style={{ maxWidth: 260 }}>
              <label>Rəf № <span className={styles.fieldHint}>(istəyə bağlı)</span></label>
              <input
                type="text"
                name="shelf_number"
                value={formData.shelf_number}
                onChange={handleChange}
                placeholder="Məs: A-12"
              />
            </div>
          )}

          {/* Müəssisə — fiziki/hər ikisi kateqoriyasında */}
          {(isBookFiziki || isBookHerIkisi) && (
            <div className={styles.formGroup}>
              <label>Müəssisə (kitabın saxlanıldığı kitabxana) <span className={styles.required}>*</span></label>
              <select name="institution_id" value={formData.institution_id} onChange={handleChange} required>
                <option value="">— Müəssisə seçin —</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
              </select>
            </div>
          )}

          {/* Say — fiziki/hər ikisi kateqoriyasında */}
          {(isBookFiziki || isBookHerIkisi) && (
            <div className={styles.formGroup} style={{ maxWidth: 220 }}>
              <label>
                {linkedDirection === 'qty' ? 'Əlavə ediləcək say' : 'Say (nüsxə)'}
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min={1}
                placeholder="1"
              />
              {linkedDirection === 'qty' && linkedBookQuantity !== null && (
                <span className={styles.fieldHint}>Cari: {linkedBookQuantity} → yeni: {linkedBookQuantity + (parseInt(formData.quantity) || 1)}</span>
              )}
            </div>
          )}

          {/* Kitab kateqoriyası: Müəllif + ISBN */}
          {isBookCategory ? (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Müəllif</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Müəllifin adı" readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
              <div className={styles.formGroup}>
                <label>ISBN</label>
                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="978-9952-8283-0-1" maxLength={20} readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
            </div>
          ) : (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Müəllif</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Müəllifin adı" readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
              <div className={styles.formGroup}>
                <label>Nömrə / Sıra №</label>
                <input type="text" name="order_number" value={formData.order_number} onChange={handleChange} placeholder="Məs: 45/2025" />
              </div>
            </div>
          )}

          {/* Kitab üçün: Nəşr ili + Nəşriyyat yeri */}
          {isBookCategory && (
            <>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nəşr ili</label>
                <input type="number" name="publication_year" value={formData.publication_year} onChange={handleChange} placeholder="Məs: 2023" min={1900} max={new Date().getFullYear()} readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
              <div className={styles.formGroup}>
                <label>Nəşriyyat yeri</label>
                <input type="text" name="publisher_location" value={formData.publisher_location} onChange={handleChange} placeholder="Məs: Bakı" readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Ön söz <span className={styles.fieldHint}>(istəyə bağlı)</span></label>
              <textarea name="foreword" value={formData.foreword} onChange={handleChange} rows={4} placeholder="Kitabın ön sözünü buraya daxil edin..." />
            </div>
            {(isBookFiziki || isBookHerIkisi) && (
              <div className={styles.formGroup} style={{ maxWidth: 260 }}>
                <label>Sıra № <span className={styles.fieldHint}>(istəyə bağlı)</span></label>
                <input type="text" name="order_number" value={formData.order_number} onChange={handleChange} placeholder="Məs: 45/2025" />
              </div>
            )}
            </>
          )}

          {/* Qiymət + Yükləməyə icazə */}
          {(!isBookElektron || !isBookFiziki) && (
          <div className={styles.formRow}>
            {!isBookElektron && (
              <div className={styles.formGroup}>
                <label>Qiymət (AZN)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0 — pulsuz" min={0} step="0.01" readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
              </div>
            )}
            {!isBookFiziki && (
              <div className={styles.formGroup}>
                <label>Yükləməyə icazə</label>
                <select name="allow_download" value={formData.allow_download} onChange={handleChange} disabled={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined}>
                  <option value="1">İcazə var</option>
                  <option value="0">İcazə yoxdur</option>
                </select>
              </div>
            )}
          </div>
          )}

          {/* Təsvir + Mündəricat */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Təsvir</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="PDF haqqında qısa məlumat" readOnly={!!linkedBookId} style={linkedBookId ? { background: '#f0f2f5', cursor: 'not-allowed' } : undefined} />
            </div>
            <div className={styles.formGroup}>
              <label>Mündəricat</label>
              <textarea name="table_of_contents" value={formData.table_of_contents} onChange={handleChange} rows={4} placeholder="Mündericatı buraya yapışdırın..." style={{ fontFamily: "monospace", fontSize: "13px" }} />
            </div>
          </div>

          {/* PDF faylı + Üz qabığı */}
          <div className={styles.formRow}>
            {!isBookFiziki && !(linkedBookId && (linkedDirection === 'fiziki' || linkedDirection === 'qty' || linkedDirection === 'ikisi-elektron')) && (
            <div className={styles.formGroup}>
              <label>PDF Faylı <span className={styles.required}>*</span></label>
              <label className={`${styles.fileZone} ${formData.file ? styles.hasFile : ""}`}>
                <input type="file" accept="application/pdf" onChange={e => setFormData(p => ({ ...p, file: e.target.files[0] || null }))} style={{ display: "none" }} />
                {formData.file ? (
                  <span className={styles.fileName}><UploadFileIcon fontSize="small" /> {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                ) : (
                  <span className={styles.filePlaceholder}><UploadFileIcon /> Seçin və ya sürükləyin</span>
                )}
              </label>
            </div>
            )}
            <div className={styles.formGroup}>
              <label>Üz qabığı şəkli</label>
              <label className={`${styles.fileZone} ${formData.coverImage ? styles.hasFile : ""}`}>
                <input type="file" accept="image/*" onChange={e => setFormData(p => ({ ...p, coverImage: e.target.files[0] || null }))} style={{ display: "none" }} />
                {formData.coverImage ? (
                  <span className={styles.fileName}>{formData.coverImage.name}</span>
                ) : (
                  <span className={styles.filePlaceholder}>Şəkil seçin (istəyə bağlı)</span>
                )}
              </label>
              {formData.coverImage && (
                <img src={URL.createObjectURL(formData.coverImage)} alt="preview" className={styles.coverPreview} />
              )}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loader}>
            {loader ? <CircularProgress size={18} style={{ color: "#fff", marginRight: 8 }} /> : null}
            {loader ? "Əlavə edilir..." : "PDF-i Əlavə Et"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

export default AddBookPage;
