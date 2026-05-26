import { useNavigate } from 'react-router-dom';
import BookCover from '../BookCover';
import styles from './index.module.scss';
import { displayCategoryName } from '../../Constants/categoryDisplay';

export default function BookCard({ pdf, view = 'grid' }) {
  const navigate = useNavigate();
  const typeLower = (pdf?.pdf_type?.name || '').toLowerCase();
  const isHerIkisi = typeLower.includes('ikisi');
  const isFiziki = typeLower.includes('fiziki') && !isHerIkisi;

  const year = pdf?.pdfDate || pdf?.created_at
    ? new Date(pdf.pdfDate || pdf.created_at).getFullYear()
    : null;

  const metaParts = [
    year,
    pdf?.pages ? `${pdf.pages} səh.` : (pdf?.pageCount ? `${pdf.pageCount} səh.` : null),
  ].filter(Boolean);

  if (view === 'list') {
    return (
      <div className={styles.listCard} onClick={() => navigate(`/library/${pdf.id}`)}>
        <div className={styles.listCover}>
          <BookCover pdf={pdf} />
        </div>
        <div className={styles.listBody}>
          <div className={styles.listTop}>
            {pdf.category?.name && (
              <span className="mmu-badge">{displayCategoryName(pdf.category.name)}</span>
            )}
          </div>
          <h3 className={styles.listTitle}>{pdf.title}</h3>
          {pdf.author && <div className={styles.listAuthor}>{pdf.author}</div>}
          {pdf.description && (
            <p className={styles.listDesc}>{pdf.description}</p>
          )}
        </div>
        <div className={styles.listMeta}>
          {!isFiziki && pdf.downloads !== undefined && (
            <span className={styles.metaStat}>↓ {pdf.downloads}</span>
          )}
          {pdf.reads !== undefined && (
            <span className={styles.metaStat}>👁 {pdf.reads}</span>
          )}
          {pdf.rating && (
            <span className={styles.metaStat}>★ {pdf.rating}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridCard} onClick={() => navigate(`/library/${pdf.id}`)}>
      <div className={styles.coverWrap}>
        <BookCover pdf={pdf} />
        {pdf.language && (
          <span className={styles.langBadge}>{pdf.language.toUpperCase()}</span>
        )}
        {pdf.isFavorite !== undefined && (
          <button
            className={`${styles.favBtn} ${pdf.isFavorite ? styles.favBtnActive : ''}`}
            onClick={(e) => e.stopPropagation()}
            title="Sevimlilər"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={pdf.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
      </div>
      <div className={styles.body}>
        {pdf.category?.name && (
          <span className="mmu-badge" style={{ fontSize: 11, marginBottom: 6 }}>{displayCategoryName(pdf.category.name)}</span>
        )}
        <h3 className={styles.title}>{pdf.title}</h3>
        {pdf.author && <div className={styles.author}>{pdf.author}</div>}
        <div className={styles.footer}>
          {metaParts.length > 0 && (
            <span className={styles.stat}>{metaParts.join(' • ')}</span>
          )}
          {pdf.rating && (
            <span className={styles.rating}>★ {pdf.rating}</span>
          )}
          {!isFiziki && !pdf.rating && !metaParts.length && pdf.downloads !== undefined && (
            <span className={styles.stat}>↓ {pdf.downloads}</span>
          )}
        </div>
      </div>
    </div>
  );
}
