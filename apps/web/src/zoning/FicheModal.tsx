import { useEffect, useState } from "react";

interface Props {
  title: string;
  pages: string[];
  onClose: () => void;
}

export function FicheModal({ title, pages, onClose }: Props) {
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setPage((p) => Math.min(pages.length - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length, onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h3>{title}</h3>
            <p>
              Page {page + 1} / {pages.length} · Source : Agence Urbaine de Casablanca, PAU homologué 2025
            </p>
          </div>
          <div className="modal-actions">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} title="Zoom −">−</button>
            <span className="zoom">{Math.round(zoom * 100)} %</span>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} title="Zoom +">+</button>
            <a href={pages[page]} download className="btn">⬇ Télécharger</a>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </header>
        <div className="modal-body">
          <img
            src={pages[page]}
            alt={`${title} — page ${page + 1}`}
            style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
          />
        </div>
        {pages.length > 1 && (
          <footer className="modal-footer">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Précédente
            </button>
            <div className="page-dots">
              {pages.map((_, i) => (
                <button
                  key={i}
                  className={`page-dot ${i === page ? "active" : ""}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
              disabled={page === pages.length - 1}
            >
              Suivante →
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
