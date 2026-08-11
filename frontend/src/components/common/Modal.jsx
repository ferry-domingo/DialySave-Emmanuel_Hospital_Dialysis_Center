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
    <div className="app-viewport-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-3">

      <div className={`app-modal-panel max-h-[96vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl`}>

        <div className="mb-2 flex items-center justify-between">

          <h2 className="text-lg font-bold text-slate-900">
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
