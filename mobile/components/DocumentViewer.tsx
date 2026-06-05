import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Download, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMidTest } from '@/types';
import PdfViewer from './PdfViewer';
import SlidesViewer from './SlidesViewer';
import EmptyState from './EmptyState';
import QuestionnaireViewer from './QuestionnaireViewer';

interface Props {
  uri?: string;
  type?: 'content' | 'test' | 'video' | 'image' | 'test-question' | 'result-slide';
  testData?: IMidTest;
  slides?: (string | { file: string; note?: string; })[];
  questionnaire?: any;
  currentQuestionIndex?: number;
  onMessage?: (event: any) => void;
  title?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

interface DocumentViewerRef {
  setZoom?: (scale: number) => void;
  resetZoom?: () => void;
  pauseMedia?: () => void;
  goToPage?: (page: number) => void;
}

const DocumentViewer = forwardRef<DocumentViewerRef, Props>(({
  uri,
  type = 'content',
  testData,
  slides,
  questionnaire,
  currentQuestionIndex,
  onMessage,
  title,
  onDownload,
  onClose,
}, ref) => {
  const insets = useSafeAreaInsets();
  const pdfViewerRef = useRef<any>(null);
  const slidesViewerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    setZoom: (scale: number) => {
      if (type === 'content' && pdfViewerRef.current?.setZoom) {
        pdfViewerRef.current.setZoom(scale);
      } else if ((type === 'image' || type === 'video') && slidesViewerRef.current?.setZoom) {
        slidesViewerRef.current.setZoom(scale);
      }
    },
    resetZoom: () => {
      if (type === 'content' && pdfViewerRef.current?.resetZoom) {
        pdfViewerRef.current.resetZoom();
      } else if ((type === 'image' || type === 'video') && slidesViewerRef.current?.resetZoom) {
        slidesViewerRef.current.resetZoom();
      }
    },
    pauseMedia: () => {
      // Try to pause any media playing inside the active viewer (pdf viewer or slides viewer)
      try {
        const pdfRef: any = pdfViewerRef.current;
        const slidesRef: any = slidesViewerRef.current;

        if (pdfRef) {
          if (typeof pdfRef.pauseMedia === 'function') {
            pdfRef.pauseMedia();
            return;
          }
          if (typeof pdfRef.pause === 'function') {
            pdfRef.pause();
            return;
          }
        }

        if (slidesRef) {
          if (typeof slidesRef.pauseMedia === 'function') {
            slidesRef.pauseMedia();
            return;
          }
          if (typeof slidesRef.pause === 'function') {
            slidesRef.pause();
            return;
          }
          if (typeof slidesRef.stop === 'function') {
            slidesRef.stop();
            return;
          }
        }
      } catch (e) {
        console.log('DocumentViewer.pauseMedia error', e);
      }
    },
    goToPage: (page: number) => {
      if (type === 'content' && pdfViewerRef.current?.goToPage) {
        pdfViewerRef.current.goToPage(page);
      } else if ((type === 'image' || type === 'video') && slidesViewerRef.current?.goToPage) {
        slidesViewerRef.current.goToPage(page);
      }
    }
  }));

  let content = null;
  
  if (type === 'test-question' && testData && typeof currentQuestionIndex === 'number') {
    content = (
      <QuestionnaireViewer 
        midTest={testData} 
        currentQuestionIndex={currentQuestionIndex} 
        onMessage={onMessage}
      />
    );
  } else if (type === 'test' && testData) {
    content = <QuestionnaireViewer midTest={testData} currentQuestionIndex={0} onMessage={onMessage} />;
  } else if (type === 'content' && uri) {
    content = <PdfViewer ref={pdfViewerRef} uri={uri} />;
  } else if ((type === 'image' || type === 'video') && slides && slides.length > 0) {
    content = <SlidesViewer ref={slidesViewerRef} slides={slides} />;
  } else {
    content = <EmptyState message="Nta document ibonetse" />;
  }

  return (
    <View style={styles.container}>
      {(title || onDownload || onClose) && (
        <View style={[styles.header, { paddingTop: insets.top + 0 }]}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#333" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Document'}</Text>
          {onDownload && (
            <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
              <Download size={20} color="#3363AD" />
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.contentArea}>{content}</View>
    </View>
  );
});

DocumentViewer.displayName = 'DocumentViewer';

export default DocumentViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b10e0eff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  downloadButton: {
    padding: 8,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});