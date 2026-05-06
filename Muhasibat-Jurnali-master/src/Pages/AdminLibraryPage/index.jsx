import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";

function AdminLibraryPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    categoryId: "",
    price: "",
    language: "",
    pdfDate: "",
    image: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [imageErrors, setImageErrors] = useState(new Set());
  
  // 1. Yeni: Məlumat çəkmə məntiqini təkrar istifadə oluna bilən funksiyaya ayırdıq
  const fetchPdfs = async (currentPage = page, currentSearch = searchTerm) => {
    store.loader.setData(true);
    const tokenAdmin = localStorage.getItem("tokenAdmin");

    try {
      // Base URL-in düzgün formatını təmin etmək üçün
      const baseUrl = Base_Url_Server.endsWith('/') ? Base_Url_Server : `${Base_Url_Server}/`;
      
      const [pdfRes, catRes] = await Promise.all([
        // PDF-ləri çəkirik
        axios.get(`${baseUrl}pdfs?page=${currentPage}&search=${currentSearch}`, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        }),
        // Kateqoriyaları çəkirik
        axios.get(`${baseUrl}categories/pdfs`),
      ]);
      setBooks(pdfRes.data.data.pdfs || []);
      setCategories(catRes.data.data.categories || []);
      setPageCount(pdfRes.data.data.pagination.total_pages);
    } catch (err) {
      console.error("PDF və ya kateqoriya məlumatları çəkilmədi:", err);
    } finally {
      store.loader.setData(false);
    }
  };

  // Admin auth yoxlanışı (Dəyişməyib)
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

  // Kitablar və kateqoriyalar - fetchPdfs istifadə edilir
  useEffect(() => {
    fetchPdfs();
  }, [page, searchTerm]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Kitabı silmək istədiyinizə əminsiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });

    if (result.isConfirmed) {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      try {
        await axios.delete(`${Base_Url_Server}pdfs/${id}`, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        
        // 2. KRİTİK DÜZƏLİŞ: Uğurlu silinmədən sonra datanı yenidən çəkirik.
        await fetchPdfs();

        Swal.fire({
          icon: "success",
          title: "Kitab uğurla silindi!",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        // 3. KRİTİK DÜZƏLİŞ: Xəta mesajını API-dən götürüb göstəririk.
        const errorMessage = err.response?.data?.message || "Silinmə zamanı gözlənilməyən xəta baş verdi!";
        console.error("PDF silinmə xətası:", err);
        Swal.fire({
          icon: "error",
          title: "Xəta ❌",
          text: errorMessage,
          timer: 2500,
          showConfirmButton: true,
        });
      }
    }
  };

  const openEditForm = (book) => {
    setEditingBook(book);
    // created_at'den tarihi al (YYYY-MM-DD formatına çevir)
    const pdfDate = book.created_at ? book.created_at.split("T")[0] : "";
    setEditData({
      title: book.title,
      description: book.description,
      categoryId: book.category.id,
      price: book.price,
      language: book.language,
      pdfDate: pdfDate,
      image: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files.length > 0) {
      setEditData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const formData = new FormData();
      formData.append("title", editData.title);
      formData.append("description", editData.description);
      formData.append("categoryId", editData.categoryId);
      formData.append("price", editData.price);
      formData.append("language", editData.language);
      formData.append("pdfDate", editData.pdfDate);
      
      // Sekil varsa elave et
      if (editData.image) {
        formData.append("image", editData.image);
      }

      await axios.put(`${Base_Url_Server}pdfs/${editingBook.id}`, formData, {
        headers: { 
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Yenilənmədən sonra da datanı yenidən çəkirik
      await fetchPdfs(); 
      setEditingBook(null);

      Swal.fire({
        icon: "success",
        title: "Kitab uğurla redaktə olundu!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Redaktə zamanı xəta baş verdi!",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className={styles.adminBooks}>
      <div className={styles.header}>
        <h3>Kitabları idarə et</h3>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Axtar"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => navigate("/admin/add-book")}>
          <AddCircleOutlineIcon /> Əlavə et
        </button>
      </div>

      {/* Edit Form (Dəyişməyib) */}
      <div className={styles.editForm} style={editingBook ? {} : { maxHeight: "0", padding: "0" }}>
        <form onSubmit={submitEdit} style={editingBook ? { opacity: "1" } : {}}>
          <input type="text" name="title" value={editData.title} onChange={handleEditChange} placeholder="Başlıq" required />
          <textarea name="description" value={editData.description} onChange={handleEditChange} placeholder="Təsvir" rows={3} />
          <select name="categoryId" value={editData.categoryId} onChange={handleEditChange}>
            <option value="">Kateqoriya seç</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input type="text" name="price" value={editData.price} onChange={handleEditChange} placeholder="Qiymət" />
          <select name="language" value={editData.language} onChange={handleEditChange}>
            <option value="">Dil seç</option>
            <option value="az">Azərbaycan dili</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
          <input 
            type="date" 
            name="pdfDate" 
            value={editData.pdfDate} 
            onChange={handleEditChange} 
            placeholder="PDF Tarixi"
            required
          />
          <div className={styles.formGroup}>
            <label>Qapaq Şəkli (Yeniləmək üçün)</label>
            <input 
              type="file" 
              name="image"
              accept="image/*" 
              onChange={handleEditChange}
            />
            {editData.image && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={URL.createObjectURL(editData.image)} 
                  alt="preview" 
                  style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit">Yadda saxla</button>
            <button type="button" onClick={() => setEditingBook(null)}>Ləğv et</button>
          </div>
        </form>
      </div>

      {/* Table (Dəyişməyib) */}
      <div className={styles.bookList}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Görsel</th>
              <th>Başlıq</th>
              <th>Açıqlama</th>
              <th>Dil</th>
              <th>Qiymət</th>
              <th>Kateqoriya</th>
              <th>Demo</th>
              <th>Yüklənmə sayı</th>
              <th>Yaradılma tarixi</th>
              <th>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book, i) => (
              <tr key={book.id}>
                <td>{i + 1}</td>
                <td>
                  {book.image_path && !imageErrors.has(book.id) ? (
                    <img 
                      src={formatServerFilePath(book.image_path)}
                      alt={book.title}
                      style={{ width: '70px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={() => {
                        setImageErrors(prev => new Set([...prev, book.id]));
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '70px', 
                      height: '50px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#666',
                      textAlign: 'center',
                      padding: '5px'
                    }}>
                      Sekil yoxdur
                    </div>
                  )}
                </td>
                <td className={styles.title}>{book.title}</td>
                <td className={styles.title}>{book.description?.length <= 100 ? book.description : book.description?.slice(0, 100) + "..."}</td>
                <td>{book.language}</td>
                <td>{book.price}</td>
                <td>{book.category.name}</td>
                <td>
                  <a href={Base_Url_Server + book.file_path?.split("/home/muhasibatjurnal/backend-mmu/")[1]} target="_blank" rel="noreferrer">
                    Demo
                  </a>
                </td>
                <td>{book.downloads}</td>
                <td>{book.created_at.split("T")[0]}</td>
                <td>
                  <Tooltip title="Redaktə et" placement="top">
                    <button onClick={() => openEditForm(book)}>
                      <EditDocumentIcon />
                    </button>
                  </Tooltip>
                  <Tooltip title="Sil" placement="top">
                    <button onClick={() => handleDelete(book.id)}>
                      <DeleteIcon />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination (Dəyişməyib) */}
        {pageCount > 1 && (
          <div className={styles.pagination}>
            <button onClick={() => setPage(page > 1 ? page - 1 : pageCount)}>{"<"}</button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button key={i} className={page === i + 1 ? styles.activePage : ""} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(page < pageCount ? page + 1 : 1)}>{">"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLibraryPage;