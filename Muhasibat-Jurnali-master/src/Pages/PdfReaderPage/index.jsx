import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import CircularProgress from "@mui/material/CircularProgress";
import useSessionTracker from "../../hooks/useSessionTracker";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 700;
const SIDEBAR_DEFAULT = 270;

function PdfReaderPage() {
  const { id } = useParams();
  useSessionTracker();

  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(700);
  const [showToc, setShowToc] = useState(true);
  const [docError, setDocError] = useState(false);
  const [tocSearch, setTocSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState("toc");
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);

  const canvasRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(SIDEBAR_DEFAULT);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(Base_Url_Server + "pdfs/" + id, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => setPdf(res.data.data.pdf))
      .catch(() => setDocError(true));
  }, [id]);

  // Fit page width to container
  useEffect(() => {
    const measure = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth - 16;
      setPageWidth(Math.min(Math.max(w, 320), 900));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [showToc, sidebarWidth]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPageNumber((p) => Math.min(p + 1, numPages || 1));
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setPageNumber((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages]);

  // Scroll to top on page change
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.scrollTop = 0;
  }, [pageNumber]);

  // Drag-to-resize
  const onDragStart = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const delta = dragStartXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(dragStartWidthRef.current + delta, SIDEBAR_MIN), SIDEBAR_MAX);
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const onDocLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    const token = localStorage.getItem("token");
    axios.post(
      Base_Url_Server + "pdfs/" + id + "/read",
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    ).catch(() => {});
  }, [id]);
  const onDocLoadError  = useCallback(() => setDocError(true), []);

  const prev = () => setPageNumber((p) => Math.max(p - 1, 1));
  const next = () => setPageNumber((p) => Math.min(p + 1, numPages || 1));

  const hasForeword = !!(pdf?.foreword?.trim());
  const hasToc      = !!(pdf?.table_of_contents?.trim());

  const tocLines = (pdf?.table_of_contents || "")
    .split("\n").map((l) => l.trim()).filter(Boolean);

  const tocQuery    = tocSearch.trim().toLowerCase();
  const filteredToc = tocQuery ? tocLines.filter((l) => l.toLowerCase().includes(tocQuery)) : tocLines;

  const pdfUrl = pdf ? formatServerFilePath(pdf.file_path) : null;

  const highlightText = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className={styles.tocHighlight}>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className={styles.reader}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => window.close()} title="Bağla">←</button>
        <div className={styles.title}>{pdf?.title || "Yüklənir..."}</div>
        <div className={styles.headerControls}>
          <button
            className={`${styles.tocToggleBtn} ${showToc ? styles.active : ""}`}
            onClick={() => setShowToc((v) => !v)}
          >
            {hasForeword && hasToc ? "Məzmun" : hasForeword ? "Ön söz" : "Mündəricat"}
          </button>
          <button className={styles.closeBtn} onClick={() => window.close()} title="Bağla">×</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Sol ox */}
        <div
          className={`${styles.navBtn} ${pageNumber <= 1 ? styles.disabled : ""}`}
          onClick={prev} title="Əvvəlki səhifə"
        >‹</div>

        {/* PDF canvas */}
        <div className={styles.canvasWrap} ref={canvasRef}>
          {docError ? (
            <div className={styles.errorWrap}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <p>PDF faylı yüklənə bilmədi.</p>
              <p style={{ color: "#666", fontSize: 12 }}>Fayl mövcud olmaya bilər.</p>
            </div>
          ) : pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocLoadSuccess}
              onLoadError={onDocLoadError}
              loading={
                <div className={styles.loaderWrap}>
                  <CircularProgress style={{ color: "#6eb5ff" }} />
                  <span>PDF yüklənir...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                className={styles.pdfPage}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          ) : (
            <div className={styles.loaderWrap}>
              <CircularProgress style={{ color: "#6eb5ff" }} />
              <span>Məlumat yüklənir...</span>
            </div>
          )}
        </div>

        {/* Sağ ox */}
        <div
          className={`${styles.navBtn} ${pageNumber >= (numPages || 1) ? styles.disabled : ""}`}
          onClick={next} title="Növbəti səhifə"
        >›</div>

        {/* Sidebar */}
        {showToc && (
          <aside className={styles.sidebar} style={{ width: sidebarWidth }}>

            {/* Drag handle */}
            <div className={styles.dragHandle} onMouseDown={onDragStart} title="Sürükləyərək genişləndir" />

            {/* Tabs — hər ikisi varsa */}
            {hasForeword && hasToc ? (
              <div className={styles.sidebarTabs}>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === "toc" ? styles.tabActive : ""}`}
                  onClick={() => setSidebarTab("toc")}
                >Mündəricat</button>
                <button
                  className={`${styles.sidebarTab} ${sidebarTab === "foreword" ? styles.tabActive : ""}`}
                  onClick={() => setSidebarTab("foreword")}
                >Ön söz</button>
              </div>
            ) : (
              <div className={styles.sidebarHeader}>
                {hasForeword ? "Ön söz" : "Mündəricat"}
                {sidebarTab === "toc" && tocQuery && (
                  <span className={styles.tocCount}>{filteredToc.length} / {tocLines.length}</span>
                )}
              </div>
            )}

            {/* Mündəricat panel */}
            {(sidebarTab === "toc" || !hasForeword) && (
              <>
                {tocLines.length > 0 && (
                  <div className={styles.tocSearchWrap}>
                    <input
                      className={styles.tocSearchInput}
                      type="text"
                      placeholder="Axtar..."
                      value={tocSearch}
                      onChange={(e) => setTocSearch(e.target.value)}
                    />
                    {tocSearch && (
                      <button className={styles.tocSearchClear} onClick={() => setTocSearch("")}>×</button>
                    )}
                  </div>
                )}
                <div className={styles.tocList}>
                  {tocLines.length === 0 ? (
                    <div className={styles.tocEmpty}>Bu kitab üçün<br />mündəricat əlavə edilməyib.</div>
                  ) : filteredToc.length === 0 ? (
                    <div className={styles.tocEmpty}>Heç bir nəticə tapılmadı.</div>
                  ) : (
                    filteredToc.map((line, i) => (
                      <div key={i} className={styles.tocItem}>
                        {highlightText(line, tocQuery)}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Ön söz panel */}
            {(sidebarTab === "foreword" || (!hasToc && hasForeword)) && (
              <div className={styles.forewordContent}>
                {pdf.foreword}
              </div>
            )}

          </aside>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <button className={styles.pageNavBtn} onClick={prev} disabled={pageNumber <= 1} title="Əvvəlki">‹</button>
        <div className={styles.pageCounter}>
          {pageNumber}
          {numPages && <span className={styles.pageTotal}> / {numPages}</span>}
        </div>
        <button className={styles.pageNavBtn} onClick={next} disabled={pageNumber >= (numPages || 1)} title="Növbəti">›</button>
      </footer>

    </div>
  );
}

export default PdfReaderPage;
