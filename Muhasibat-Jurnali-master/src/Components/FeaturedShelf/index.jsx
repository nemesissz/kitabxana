import { useNavigate } from 'react-router-dom';
import BookCard from '../BookCard';
import styles from './index.module.scss';

export default function FeaturedShelf({ title, subtitle, eyebrow, icon, pdfs = [], viewAllPath }) {
  const navigate = useNavigate();
  if (!pdfs.length) return null;

  return (
    <section className={styles.section}>
      <div className="mmu-container">
        <div className="mmu-section-head">
          <div>
            <span className="mmu-eyebrow">
              {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
              {eyebrow}
            </span>
            <h2 style={{ marginTop: 10 }}>{title}</h2>
            {subtitle && <p className="mmu-lead" style={{ marginTop: 8, fontSize: 15 }}>{subtitle}</p>}
          </div>
          {viewAllPath && (
            <button
              className="mmu-btn mmu-btn-ghost mmu-btn-sm"
              onClick={() => navigate(viewAllPath)}
              style={{ flexShrink: 0 }}
            >
              Hamısı →
            </button>
          )}
        </div>

        <div className={styles.shelf}>
          {pdfs.map((pdf) => (
            <div key={pdf.id} className={styles.item}>
              <BookCard pdf={pdf} view="grid" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
