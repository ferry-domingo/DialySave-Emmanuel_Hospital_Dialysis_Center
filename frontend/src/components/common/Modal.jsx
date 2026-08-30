import { X } from "lucide-react";

const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  maxWidth = "max-w-xl",
}) => {
  if (!isOpen) return null;

  return (
    <div className="app-viewport-overlay ui-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3">

      <div className={`app-modal-panel ui-modal-panel max-h-[96vh] w-full ${maxWidth} overflow-y-auto rounded-3xl p-4`}>

        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">

          <h2 className="text-lg font-black tracking-[-0.025em] text-slate-900">
            {title}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
};

export default Modal;
