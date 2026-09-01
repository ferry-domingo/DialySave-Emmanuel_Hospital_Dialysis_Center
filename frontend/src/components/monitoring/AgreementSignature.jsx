import { useEffect, useRef, useState } from "react";
import { Calendar, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/authStore";
import { signAgreement } from "../../api/dialysisSessionApi";
import { patientName, signatureDate, signatureName, userName } from "../../utils/agreementSignatures";

const defaultPlacement = { x: 0, y: 0, scale: 1 };
const signaturePlacement = (signature) => ({ ...defaultPlacement, ...(signature?.placement || {}) });

const SignaturePad = ({ value, onChange, placement, onPlacementChange }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, canvas.width / image.width, canvas.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      };
      image.src = value;
    }
  }, [value]);

  const point = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const start = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const { x, y } = point(event);
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = "#111827";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current.getContext("2d");
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stop = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  const upload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) {
      toast.error("Upload a PNG or JPG image smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const scale = Math.min(1, canvas.width / image.width, canvas.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        const output = document.createElement("canvas");
        output.width = width;
        output.height = height;
        output.getContext("2d").drawImage(image, 0, 0, width, height);
        const png = output.toDataURL("image/png");
        if (png.length > 250_000) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          toast.error("The processed signature is too large. Use a smaller image.");
          return;
        }
        onChange(png);
      };
      image.onerror = () => toast.error("Unable to read that signature image.");
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-slate-500">Draw e-signature</span>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={upload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[9px] font-semibold text-blue-600">Upload PNG/JPG</button>
          <button type="button" onClick={clear} className="text-[9px] font-semibold text-rose-500">Clear</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={stop}
        onPointerCancel={stop}
        className="h-20 w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white"
      />
      {value && (
        <>
        <div className="relative mt-2 h-20 overflow-hidden rounded-lg bg-slate-50">
          <span className="absolute left-2 top-1 text-[8px] font-semibold uppercase tracking-wide text-slate-400">Print placement preview</span>
          <div className="absolute inset-x-4 bottom-3 border-b border-slate-500" />
          <img
            src={value}
            alt="Signature placement preview"
            className="absolute bottom-3 left-1/2 max-h-16 max-w-[90%] object-contain"
            style={{
              transform: `translateX(calc(-50% + ${placement.x}px)) translateY(${placement.y}px) scale(${placement.scale})`,
              transformOrigin: "center bottom",
            }}
          />
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { key: "scale", label: "Size", min: 0.5, max: 2, step: 0.05, valueLabel: `${Math.round(placement.scale * 100)}%` },
            { key: "x", label: "Left / Right", min: -120, max: 120, step: 1, valueLabel: `${placement.x}px` },
            { key: "y", label: "Up / Down", min: -40, max: 40, step: 1, valueLabel: `${placement.y}px` },
          ].map((control) => (
            <label key={control.key} className="text-[9px] font-semibold text-slate-500">
              <span className="mb-1 flex justify-between"><span>{control.label}</span><span>{control.valueLabel}</span></span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={placement[control.key]}
                onChange={(event) => onPlacementChange({ ...placement, [control.key]: Number(event.target.value) })}
                className="w-full accent-slate-900"
              />
            </label>
          ))}
        </div>
        </>
      )}
    </div>
  );
};

const SignatureBlock = ({ sessionId, role, label, defaultName, signature, onSignatureChange }) => {
  const [name, setName] = useState(() => signatureName(signature, defaultName));
  const [savedName, setSavedName] = useState(() => signatureName(signature, defaultName));
  const [savedAt, setSavedAt] = useState(() => signatureDate(signature));
  const [signatureImage, setSignatureImage] = useState(() => signature?.image || "");
  const [placement, setPlacement] = useState(() => signaturePlacement(signature));
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const accountIdentityLocked = ["patient", "facilityRepresentative"].includes(role) && Boolean(defaultName?.trim());
  const isSigned = Boolean(savedAt) || accountIdentityLocked;
  const signedName = savedName || defaultName;
  const canEditSignedName = ["patient", "witness", "facilityRepresentative"].includes(role);

  useEffect(() => {
    const nextName = signatureName(signature, defaultName);
    setName(nextName);
    setSavedName(nextName);
    setSavedAt(signatureDate(signature));
    setSignatureImage(signature?.image || "");
    setPlacement(signaturePlacement(signature));
    setEditing(false);
  }, [sessionId, signature, defaultName]);

  const handleSign = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      const response = await signAgreement(sessionId, {
        role,
        name: name.trim(),
        ...(role === "facilityRepresentative" ? { image: signatureImage, placement } : {}),
      });
      const savedSignature = response.data?.data?.signatures?.[role];
      const nextSignature = {
        name: savedSignature?.name || name.trim(),
        image: savedSignature?.image || signatureImage,
        placement: savedSignature?.placement || placement,
        signedAt: savedSignature?.signedAt || new Date().toISOString(),
      };
      setName(nextSignature.name);
      setSavedName(nextSignature.name);
      setSavedAt(nextSignature.signedAt);
      if (role === "witness") {
        const returnedSignatures = response.data?.data?.signatures || {};
        ["patient", "witness", "facilityRepresentative"].forEach((signatureRole) => {
          const returned = returnedSignatures[signatureRole];
          if (returned?.signedAt) onSignatureChange?.(signatureRole, returned);
        });
      } else {
        onSignatureChange?.(role, nextSignature, {
          allSessions: response.data?.scope === "global",
        });
      }
      setEditing(false);
      toast.success(`${label} signature recorded`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-100 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex h-7 flex-1 items-end border-b border-slate-300 pb-0.5 text-[10px] font-bold text-slate-900">
          {role === "facilityRepresentative" && signature?.image && <img src={signature.image} alt="E-signature" className="absolute bottom-1 left-1/2 max-h-7 max-w-[70%] -translate-x-1/2 object-contain opacity-70" />}
          {isSigned ? signedName : name || <span className="text-slate-300">Sign here</span>}
        </div>
        {isSigned && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">Signed</span>
        )}
      </div>

      <p className="mt-1.5 text-[9px] text-slate-400">Printed Name and Signature — {label}</p>

      {isSigned && !editing ? (
        <div className="mt-2 flex min-h-8 items-center justify-between gap-2">
          {savedAt ? (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <Calendar size={12} />
              {new Date(savedAt).toLocaleDateString()} ·{" "}
              {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          ) : (
            <p className="text-[9px] font-medium text-emerald-600">Verified from linked account</p>
          )}
          {canEditSignedName && (
            <button type="button" onClick={() => { setName(signedName || ""); setEditing(true); }} className="no-print flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50">
              <Pencil size={11} /> Edit
            </button>
          )}
        </div>
      ) : (
        <div className="no-print mt-2">
          <div className="flex items-center gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type full name to sign"
              className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-[10px]"
            />
            <button
              onClick={handleSign}
              disabled={saving || !name.trim()}
              className="h-8 shrink-0 rounded-lg bg-slate-950 px-3 text-[10px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {editing ? "Save" : "Sign"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setName(signedName || ""); setSignatureImage(signature?.image || ""); setPlacement(signaturePlacement(signature)); setEditing(false); }} aria-label={`Cancel editing ${label} signature`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
                <X size={13} />
              </button>
            )}
          </div>
          {role === "facilityRepresentative" && (
            <SignaturePad value={signatureImage} onChange={setSignatureImage} placement={placement} onPlacementChange={setPlacement} />
          )}
        </div>
      )}
    </div>
  );
};

const AgreementSignature = ({ session, onSignatureChange }) => {
  const { user } = useAuthStore();

  if (!session) return null;

  const signatures = session.agreement?.signatures || {};

  return (

    <div className="rounded-xl bg-white p-3 shadow-sm">

      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white">2</span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Signatures</h2>
          <p className="text-[9px] text-slate-400">By signing below, I confirm that the information provided is true and correct.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">

        <SignatureBlock
          sessionId={session.sessionId}
          role="patient"
          label="Patient"
          defaultName={patientName(session.patient)}
          signature={signatures.patient}
          onSignatureChange={onSignatureChange}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="witness"
          label="Witness"
          signature={signatures.witness}
          onSignatureChange={onSignatureChange}
        />

        <SignatureBlock
          sessionId={session.sessionId}
          role="facilityRepresentative"
          label="HD Facility Representative"
          defaultName={userName(user)}
          signature={signatures.facilityRepresentative}
          onSignatureChange={onSignatureChange}
        />

      </div>

    </div>

  );

};

export default AgreementSignature;
