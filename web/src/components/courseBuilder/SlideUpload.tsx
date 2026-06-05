import React, { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { CourseSlide } from "@/types/courseBuilder.d";
import { uploadSlideFile } from "@/services/course.service";

interface SlideUploadProps {
  onSlideAdded: (slides: CourseSlide[]) => void;
  currentOrder: number;
}

type FileType = "pdf" | "image" | "video";

const ACCEPTED_FORMATS: Record<FileType, string[]> = {
  pdf: [".pdf"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico", ".tiff"],
  video: [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"],
};

const ACCEPT_STRING = Object.values(ACCEPTED_FORMATS).flat().join(",");

function getFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  if (ACCEPTED_FORMATS.pdf.includes(`.${ext}`)) return "pdf";
  if (ACCEPTED_FORMATS.video.includes(`.${ext}`)) return "video";
  return "image";
}

export default function SlideUpload({ onSlideAdded, currentOrder }: SlideUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const handleFiles = async (files: FileList) => {
    // Convert to a stable Array immediately — FileList objects (especially from
    // DataTransfer on drag-and-drop) can become empty after the first await
    // because the browser cleans up the DataTransfer once the event handler
    // returns. Copying to an Array keeps every File reference alive.
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    const newSlides: CourseSlide[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const fileUrl = await uploadSlideFile(file);
        newSlides.push({
          id: `slide-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          fileType: getFileType(file.name),
          fileUrl,
          fileName: file.name,
          order: currentOrder + i,
          createdAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
      // Always advance the counter so progress doesn't appear stuck on failure
      setUploadProgress({ done: i + 1, total: fileArray.length });
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (newSlides.length > 0) {
      onSlideAdded(newSlides);
      toast.success(`${newSlides.length} slide(s) added successfully`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isUploading
            ? "border-blue-300 bg-blue-50 cursor-wait"
            : isDragging
            ? "border-blue-500 bg-blue-50 cursor-copy"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-blue-700">
              Uploading {uploadProgress?.done ?? 0} / {uploadProgress?.total ?? 0}…
            </p>
            <p className="text-xs text-blue-500 mt-1">Please wait, do not navigate away</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Supported: PDF, Images (JPG, PNG, GIF, WebP), Videos (MP4, MOV, MKV, WebM)
            </p>
            <p className="text-xs text-gray-500">You can upload multiple files at once</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept={ACCEPT_STRING}
        style={{ display: "none" }}
        disabled={isUploading}
      />
    </div>
  );
}
