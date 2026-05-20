import { formatServerFilePath } from '../../Constants/baseUrl';

const PALETTES = [
  ['#3D2914', '#7A4A26'],
  ['#1F3A2E', '#3A6B53'],
  ['#8B1A1A', '#C0392B'],
  ['#1A2B4A', '#3E5B8B'],
  ['#0B4F6C', '#0F7895'],
  ['#5B3A1F', '#8E6840'],
  ['#2D1B4E', '#5A3D8A'],
  ['#1B3A1B', '#2E7D32'],
];

export default function BookCover({ pdf, style = {} }) {
  const imgSrc = pdf?.image_path ? formatServerFilePath(pdf.image_path) : null;

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={pdf?.title || ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
      />
    );
  }

  const [c1, c2] = PALETTES[(pdf?.id || 0) % PALETTES.length];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)`,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '16px 12px',
      ...style,
    }}>
      <div style={{
        color: 'rgba(255,255,255,.95)', fontSize: 13, fontWeight: 600,
        lineHeight: 1.3, wordBreak: 'break-word',
      }}>
        {pdf?.title || ''}
      </div>
      {pdf?.author && (
        <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, marginTop: 4 }}>
          {pdf.author}
        </div>
      )}
    </div>
  );
}
