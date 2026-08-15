import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AnnouncementImageSlider = ({ media = [], title = "Announcement" }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); }, [media]);

  if (!media.length) return null;

  const activeMedia = media[activeIndex];
  const move = (direction) => {
    setActiveIndex((current) => (current + direction + media.length) % media.length);
  };

  return <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 sm:h-80">
    <img src={activeMedia.dataUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
    <div className="relative z-10 flex h-full w-full items-center justify-center bg-slate-950/10 p-2">
      <img
        src={activeMedia.dataUrl}
        alt={activeMedia.name || `${title} photo ${activeIndex + 1}`}
        className="block max-h-full max-w-full"
        style={{ width: "auto", height: "auto", objectFit: "contain", objectPosition: "center" }}
      />
    </div>
    {media.length > 1 && <>
      <button type="button" onClick={() => move(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-slate-950/65 text-white shadow-lg transition hover:bg-slate-950/85"><ChevronLeft size={20} /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next photo" className="absolute right-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-slate-950/65 text-white shadow-lg transition hover:bg-slate-950/85"><ChevronRight size={20} /></button>
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/65 px-2.5 py-1.5" aria-label={`Photo ${activeIndex + 1} of ${media.length}`}>
        {media.map((item, index) => <button key={`${item.name || "photo"}-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`View photo ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"}`} />)}
      </div>
      <span className="absolute right-3 top-3 z-20 rounded-full bg-slate-950/65 px-2 py-1 text-[10px] font-bold text-white">{activeIndex + 1}/{media.length}</span>
    </>}
  </div>;
};

export default AnnouncementImageSlider;
