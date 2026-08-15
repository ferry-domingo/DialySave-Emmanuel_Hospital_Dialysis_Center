import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";

const OneClickImageLightbox = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
    if (!image) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return createPortal(<div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Image preview">
    <button type="button" className="image-lightbox-close" onClick={onClose} aria-label="Close image preview"><X size={22}/></button>
    <div className="image-lightbox-tools" aria-label="Image zoom controls">
      <button type="button" onClick={() => setZoom((value) => Math.max(.5, value - .25))} disabled={zoom <= .5} aria-label="Zoom out"><Minus size={18}/></button>
      <button type="button" onClick={() => setZoom(1)} className="image-lightbox-level" aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
      <button type="button" onClick={() => setZoom((value) => Math.min(3, value + .25))} disabled={zoom >= 3} aria-label="Zoom in"><Plus size={18}/></button>
    </div>
    <button type="button" className={zoom > 1 ? "zoomed" : ""} onClick={() => setZoom((value) => value === 1 ? 2 : 1)} aria-label={zoom > 1 ? "Reset image zoom" : "Zoom in image"}>
      <img src={image.src} alt={image.alt || "Preview"} style={{ transform: `scale(${zoom})` }}/>
    </button>
  </div>, document.body);
};

export default OneClickImageLightbox;
