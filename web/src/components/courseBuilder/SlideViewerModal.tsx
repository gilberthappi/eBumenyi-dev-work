import { useEffect } from "react";
import { X, ExternalLink, FileText, Image as ImageIcon, Video } from "lucide-react";
import { CourseSlide } from "@/types/courseBuilder.d";
import { getProxyUrl } from "@/services/uploader.api";
import { getBackendURL } from "@/config/api.config";

const resolveMediaUrl = (url: string): string =>
  url.startsWith("http") ? url : `${getBackendURL()}${url}`;

interface SlideViewerModalProps {
  slide: CourseSlide | null;
  onClose: () => void;
}

export default function SlideViewerModal({ slide, onClose }: SlideViewerModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!slide) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide, onClose]);

  if (!slide) return null;

  const proxyUrl = slide.fileType === "pdf" ? getProxyUrl(slide.fileUrl) : null;

  const icon =
    slide.fileType === "pdf" ? (
      <FileText className="w-5 h-5 text-red-600" />
    ) : slide.fileType === "image" ? (
      <ImageIcon className="w-5 h-5 text-purple-600" />
    ) : (
      <Video className="w-5 h-5 text-blue-600" />
    );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ width: "92vw", height: "92vh", maxWidth: "1400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 className="text-base font-semibold text-gray-900 truncate">{slide.title}</h2>
            <span className="text-xs text-gray-500 truncate hidden sm:block">({slide.fileName})</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={proxyUrl ?? slide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in new tab</span>
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden bg-gray-900 flex items-center justify-center relative">
          {slide.fileType === "pdf" && (
            <object
              data={proxyUrl!}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-gray-400 p-8 text-center">
                <FileText className="w-14 h-14 text-red-400" />
                <p className="text-sm text-gray-300">Could not load PDF preview.</p>
                <a
                  href={proxyUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF in new tab
                </a>
              </div>
            </object>
          )}

          {slide.fileType === "image" && (
            <img
              src={slide.fileUrl}
              alt={slide.title}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {slide.fileType === "video" && (
            <video
              src={resolveMediaUrl(slide.fileUrl)}
              controls
              autoPlay
              className="max-w-full max-h-full"
              crossOrigin="anonymous"
            />
          )}
        </div>
      </div>
    </div>
  );
}
