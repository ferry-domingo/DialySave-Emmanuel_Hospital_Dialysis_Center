import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalItems, pageSize = 10, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span className="px-2 text-sm font-semibold text-slate-700">Page {page} of {totalPages}</span>
        <button aria-label="Next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export default Pagination;
