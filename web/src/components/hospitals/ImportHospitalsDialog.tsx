import React, { useCallback, useRef, useState } from "react";
import Modal from "@/components/common/Modal";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importHospitals } from "@/services/hospitals.service";
import { hospitalKeys } from "@/utils/constants/queryKeys";
import {
  ArrowUpTrayIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ImportHospitalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: string[];
}

const ImportHospitalsDialog: React.FC<ImportHospitalsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: importHospitals,
    onSuccess: (data) => {
      setResult(data.data);
      queryClient.invalidateQueries({ queryKey: hospitalKeys.all });
      toast.success(`Import complete: ${data.data.created} hospitals added`);
    },
    onError: () => {
      toast.error("Import failed. Please check your file and try again.");
    },
  });

  const handleFile = (file: File) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Only Excel (.xlsx, .xls) or CSV files are supported");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    mutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Hospitals from Excel">
      <div className="space-y-5">
        {/* Format hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">Expected Excel columns:</p>
          <p className="font-mono text-xs">province · district · sector · facility_name</p>
          <p className="text-xs mt-1 text-blue-600">Duplicates (same name + district) are skipped automatically.</p>
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-blue-50"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleInputChange}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <TableCellsIcon className="w-8 h-8 text-green-600 shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <ArrowUpTrayIcon className="w-10 h-10 text-gray-400" />
                <p className="font-medium text-gray-700">Drop your Excel file here</p>
                <p className="text-sm">or click to browse — .xlsx / .xls / .csv</p>
              </div>
            )}
          </div>
        )}

        {/* Result summary */}
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{result.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total rows</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{result.created}</p>
                <p className="text-xs text-green-600 mt-0.5">Created</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                <p className="text-xs text-yellow-600 mt-0.5">Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-red-700 font-medium text-sm mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>{result.errors.length} row(s) had errors</span>
                </div>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-28 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length === 0 && (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                <span>All rows processed without errors</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || mutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#073e92] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              {mutation.isPending ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportHospitalsDialog;
