import { FC, useEffect, useState, useCallback } from "react";
import { uploadFileByType, getProxyUrl } from "@/services/uploader.api";
import { createDocument, deleteDocument, getAllDocuments, IDocument, updateDocument } from "@/services/document.service";
import Modal from "../common/Modal";

interface DocumentModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentModal: FC<DocumentModalProps> = ({ courseId, isOpen, onClose }) => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<IDocument | null>(null);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllDocuments();
      // filter by courseId client-side if API does not support filter
      const docs = (res.data || []).filter((d: IDocument) => d.courseId === courseId);
      setDocuments(docs);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen, fetchDocuments]);

  const handleUpload = async () => {
    if (!file && !fileName) return;

    setUploading(true);
    try {
      // If a file is selected -> upload it first to get a URL
      let fileUrl = editing?.file || '';

      if (file) {
        const uploadRes = await uploadFileByType(file);
        fileUrl = uploadRes?.data?.url || fileUrl;
      }

      const payload = { fileName, file: fileUrl || '', courseId };

      if (editing) {
        await updateDocument(editing.id, payload);
      } else {
        await createDocument(payload);
      }

      await fetchDocuments();
      setFileName('');
      setFile(null);
      setEditing(null);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete document?')) return;
    try {
      await deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      console.log(err);
    }
  };

  const startEdit = (doc: IDocument) => {
    setEditing(doc);
    setFileName(doc.fileName);
    // leave file as null so upload is optional
    setFile(null);
  };

  return (
    // center modal to avoid collision with header and allow responsive width
    <Modal isOpen={isOpen} onClose={onClose} title="Course Documents" centered big>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Existing Documents</h4>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <ul className="space-y-2 mt-2">
              {documents.map(d => (
                <li key={d.id} className="flex items-center justify-between bg-white p-3 rounded">
                  <div className="max-w-[70%] truncate">
                    <div className="font-medium">{d.fileName}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600" onClick={() => {
                      if (!d.file) return;
                      const isPdf = d.file.toLowerCase().includes('.pdf') || d.fileName.toLowerCase().endsWith('.pdf');
                      window.open(isPdf ? getProxyUrl(d.file) : d.file, '_blank');
                    }}>View</button>
                    <button className="text-yellow-600" onClick={() => startEdit(d)}>Edit</button>
                    <button className="text-red-600" onClick={() => handleDelete(d.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Upload Document</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">File Name</label>
              <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">File</label>
              <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOCX, PPTX, images</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button disabled={uploading} className={`px-4 py-2 ${uploading ? 'bg-gray-300 text-gray-700' : 'bg-[#4d81d2] text-white'} rounded`} onClick={handleUpload}>
              {uploading ? (editing ? 'Updating...' : 'Uploading...') : (editing ? 'Update' : 'Upload')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentModal;
