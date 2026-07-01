import { useMemo, useRef, useState } from "react";

const cx = (...c) => c.filter(Boolean).join(" ");

function DefaultCardIcon(props) {
  return (
    <svg viewBox="0 0 64 40" fill="none" aria-hidden="true" {...props}>
      <rect x="6" y="6" width="52" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M34 16h16M34 22h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ImageDropzone({
  title,
  hint = "(JPG, PNG kích thước nhỏ hơn 10MB)",
  accept = "image/png,image/jpeg",
  maxSizeMB = 10,
  file,
  onChangeFile,
  icon, // optional
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const validate = (f) => {
    if (!f) return "";
    const isImage = ["image/png", "image/jpeg"].includes(f.type);
    if (!isImage) return "Chỉ chấp nhận JPG hoặc PNG.";
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (f.size > maxBytes) return `File phải nhỏ hơn ${maxSizeMB}MB.`;
    return "";
  };

  const pickFile = () => inputRef.current?.click();

  const handleFile = (f) => {
    const msg = validate(f);
    setError(msg);
    if (msg) return;
    onChangeFile?.(f);
  };

  const onInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // reset để chọn lại đúng file vẫn trigger
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onRemove = () => {
    setError("");
    onChangeFile?.(null);
  };

  return (
    <div>
      <div
        className={cx(
          "relative rounded-xl border-2 border-dashed p-6",
          "bg-sky-50/60 border-sky-200",
          "transition",
          dragOver && "bg-sky-100/60 border-sky-300",
          error && "border-red-300 bg-red-50/50"
        )}
        onClick={pickFile}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pickFile();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />

        {!file ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-sky-500">
              {icon ? icon : <DefaultCardIcon className="h-12 w-12" />}
            </div>

            <div className="mt-4 text-sm font-semibold text-slate-800">{title}</div>
            <div className="mt-1 text-xs text-slate-600">{hint}</div>

            <div className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              Chọn ảnh / Kéo thả vào đây
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-center">
            <img
              src={previewUrl}
              alt="preview"
              className="h-28 w-full rounded-lg object-cover ring-1 ring-slate-200"
            />

            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                {file.name}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    pickFile();
                  }}
                >
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-3 text-xs font-semibold text-red-600">{error}</div>
        ) : null}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Tip: Bạn có thể kéo thả ảnh trực tiếp vào khung.
      </div>
    </div>
  );
}