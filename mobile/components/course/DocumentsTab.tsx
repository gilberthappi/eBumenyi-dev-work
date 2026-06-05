import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, StyleSheet,  ActivityIndicator } from 'react-native';
import { FileText, Download, ScanSearch, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDocumentsByCourse } from '@/services/course.api';
import DocumentViewer from '@/components/DocumentViewer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
// Use legacy FileSystem API to keep downloadAsync working until migration to new File/Directory API
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// TODO: migrate to new File/Directory API as recommended by Expo

interface Document {
  id: string;
  title: string;
  date: string;
  size: string;
  uri: string; // remote url to preview
}

interface Props {
  courseId?: string;
}

// helper to format bytes
const formatBytes = (bytes: number | null): string => {
  if (bytes === null || isNaN(Number(bytes))) return '-';
  const b = Number(bytes);
  if (b === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${parseFloat((b / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

export default function DocumentsTab({ courseId }: Props) {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split('/');
      const last = parts[parts.length - 1];
      return decodeURIComponent(last.split('?')[0]);
    } catch (e) {
      console.log(e)
      return `document_${Date.now()}`;
    }
  };

  // Remove UUID-like prefixes and duplicate extensions, keep readable name
  const cleanFileName = (rawName: string) => {
    if (!rawName) return rawName;
    let name = rawName;
    // remove query
    name = name.split('?')[0];
    // decode
    try { name = decodeURIComponent(name); } catch {};
    // If contains underscores and left part is a UUID, strip it
    // UUID regex
    const uuidPrefix = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_/;
    if (uuidPrefix.test(name)) {
      name = name.replace(uuidPrefix, '');
    } else {
      // also strip hex-like prefixes before an underscore (common uploads)
      const hexPrefix = /^[0-9a-fA-F]{8,}_[0-9a-fA-F]{1,}_/;
      if (hexPrefix.test(name)) {
        name = name.replace(hexPrefix, '');
      }
      // strip simple numeric prefixes like 12345_
      name = name.replace(/^\d+_/, '');
    }

    // Remove any leading garbage segments separated by underscores that look like IDs
    const parts = name.split('_');
    if (parts.length > 2) {
      // if first part is short hex or numeric, remove it
      const first = parts[0];
      if (/^[0-9a-fA-F]{6,}$/.test(first) || /^\d+$/.test(first)) {
        parts.shift();
        name = parts.join('_');
      }
    }

    // Fix duplicate extensions like .pdf.pdf -> .pdf
    // Preserve duplicate extensions (some files include intentional .pdf.pdf)
    // (Do not collapse duplicate extensions here)

    // Trim unwanted characters
    name = name.replace(/^_+|_+$/g, '');
    return name;
  };

  const downloadDocument = async (doc: Document) => {
    if (!doc?.uri) {
      return;
    }

    const rawName = getFileNameFromUrl(doc.uri);
    const fileName = cleanFileName(rawName) || `document_${Date.now()}`;
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      setDownloadingIds(prev => ({ ...prev, [doc.id]: true }));
      const res = await FileSystem.downloadAsync(doc.uri, fileUri);
      console.log('Document downloaded to', res.uri);

      // If the downloaded file was saved with a server-generated prefix (uuid_)
      // the returned res.uri may contain that prefix. Ensure final file path
      // uses our cleaned filename by moving the file if needed.
      let finalUri = res.uri;
      try {
        if (res.uri !== fileUri) {
          // move to our intended destination (overwrites if exists)
          await FileSystem.moveAsync({ from: res.uri, to: fileUri });
          finalUri = fileUri;
          console.log('Moved downloaded file to', finalUri);
        }
      } catch (moveErr) {
        // If move fails, at least continue using the returned uri
        console.log('Failed to move downloaded file to cleaned filename', moveErr);
      }

      try {
        const available = await Sharing.isAvailableAsync();
        // determine mime type from extension
        const ext = (fileName.split('.').pop() || '').toLowerCase();
        const mimeMap: { [k: string]: string } = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ppt: 'application/vnd.ms-powerpoint',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          txt: 'text/plain',
          csv: 'text/csv',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          mp4: 'video/mp4',
        };
        const mimeType = mimeMap[ext] || 'application/octet-stream';

        if (available) {
          await Sharing.shareAsync(finalUri, { mimeType, dialogTitle: fileName });
        } else {
          console.log('Sharing is not available on this device.');
        }
      } catch (shareErr) {
        console.log('Failed to share downloaded document', shareErr);
      }
    } catch (e) {
      console.log('Failed to download document', doc.uri, e);
    } finally {
      setDownloadingIds(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  useEffect(() => {
    async function loadDocuments() {
      if (!courseId) return;
      try {
        const resp = await getDocumentsByCourse(courseId);
        // API returns { message, statusCode, data: [...] }
        const dataArray = Array.isArray(resp?.data) ? resp.data : [];
        const mapped = dataArray.map((d: any) => {
          const rawUriName = getFileNameFromUrl(d.file || d.fileUrl || '');
          const cleaned = cleanFileName(rawUriName || String(d.id));
          return ({
            id: String(d.id),
            title: d.fileName || cleaned || 'Document',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
            size: '-',
            uri: d.file,
          });
        });
        // Fetch HEAD for each uri to get content-length
        const withSizes = await Promise.all(mapped.map(async (doc) => {
          try {
            const headResp = await fetch(doc.uri, { method: 'HEAD' });
            const lenHeader = headResp.headers.get('content-length') || headResp.headers.get('Content-Length');
            const sizeStr = lenHeader ? formatBytes(Number(lenHeader)) : '-';
            return { ...doc, size: sizeStr };
          } catch (e) {
            console.log('Failed to fetch HEAD for', doc.uri, e);
            return { ...doc, size: '-' };
          }
        }));

        setDocuments(withSizes);
      } catch (e) {
        console.log('Failed to fetch documents for course', courseId, e);
        setDocuments([]);
      }
    }
    loadDocuments();
  }, [courseId]);

  return (
    <View style={{ flex: 1, paddingLeft: 4, paddingRight: 4, paddingTop: 10}}>
      {documents === null && <LoadingSpinner />}
      {documents !== null && (
        <>
          {documents.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FileText color="#3363AD" size={32} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#3363AD', textAlign: 'center', marginBottom: 12 }}>
                Nta nyandiko ziboneka
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                Nta nyandiko zashyizweho kuri iri somo
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {documents.map((doc) => (
                <View key={doc.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText color="#3363AD" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#3363AD', fontWeight: '500', marginBottom: 4 }}>{doc.title}</Text>
                    <Text style={{ fontSize: 10, color: '#63758C' }}>{doc.date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ alignItems: 'center', marginHorizontal: 4 }} onPress={() => downloadDocument(doc)}>
                      <LinearGradient colors={["#8B8FD6", "#3363AD"]} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                        {downloadingIds[doc.id] ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Download color="#FFFFFF" size={14} />
                        )}
                      </LinearGradient>
                      <Text style={{ marginTop: 8, fontSize: 10, color: '#8B8FD6', fontWeight: '600', textAlign: 'center' }}>{downloadingIds[doc.id] ? 'Ingorana' : 'Bika'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ alignItems: 'center', marginHorizontal: 4 }} onPress={() => setPreviewDoc(doc)}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFF3FF', alignItems: 'center', justifyContent: 'center' }}>
                        <ScanSearch color="#2B6CB0" size={14} />
                      </View>
                      <Text style={{ marginTop: 8, fontSize: 10, color: '#8B8FD6', fontWeight: '600', textAlign: 'center' }}>Reba</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}
      
      {/* Preview Modal */}
      <Modal visible={!!previewDoc} animationType="slide" onRequestClose={() => setPreviewDoc(null)}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setPreviewDoc(null)} style={modalStyles.closeButton}>
            <X color="#333" size={18} />
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>{previewDoc?.title || 'Banza urebe'}</Text>
        </View>
        {previewDoc && (
          <View style={{ flex: 1 }}>
            <DocumentViewer uri={previewDoc.uri} />
          </View>
        )}
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
});
