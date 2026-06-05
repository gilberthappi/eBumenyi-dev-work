import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { CircleHelp as HelpCircle, Users, FileText ,Download as DownloadIcon, Minimize, Expand, Menu, MoreVertical, X as CloseIcon } from 'lucide-react-native';
import { CourseDrawer } from '../CourseDrawer';
import { ICourse } from '@/types';
// import FAQTab from '../course/FAQTab';
import StudentsTab from '../course/StudentsTab';
import DocumentsTab from '../course/DocumentsTab';
import FeedbackBox from '../course/FeedbackBox';

interface Props {
  title: string;
  onToggleOrientation?: () => void;
  isLandscape?: boolean;
  onDownload?: () => void;
  downloading?: boolean;
  canDownload?: boolean;
  course: ICourse;
  currentPage: string;
  onTabSelect?: (tab: 'faq' | 'students' | 'documents') => void;
  slideId?: string; // Optional slideId prop
}

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default function TopToolbar({ title, onToggleOrientation, isLandscape, onDownload, downloading, canDownload, course, currentPage, slideId }: Props) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'students' | 'documents' | 'feedback' | undefined>(undefined);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const moreButtonRef = useRef<View>(null);

  const handleMorePress = () => {
    moreButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setDropdownPosition({
        top: y + height + 4,
        right: 12
      });
      setDropdownVisible(true);
    });
  };

  const handleTabSelect = (tab: 'faq' | 'students' | 'documents' | 'feedback') => {
    setActiveTab(tab);
    setModalVisible(true);
    setDropdownVisible(false);
  };

  const downloadDisabled = !(onDownload && canDownload) || !!downloading;

  return (
    <>
      <View style={[styles.toolbar, isLandscape && styles.toolbarLandscape]}>
        <TouchableOpacity onPress={() => setDrawerVisible(true)} activeOpacity={0.7} style={[styles.toolButton]}>
          <Menu size={24} color="#3363AD" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="middle">{title}</Text>
        
        {onToggleOrientation && isLandscape? (
          <TouchableOpacity 
            style={[styles.toolButton, { marginLeft: 4 }]} 
            onPress={onToggleOrientation}
          >
            {isLandscape ? (
              <Minimize color="#333" size={18} />
            ) : (
              <Expand color="#333" size={18} />
            )}
          </TouchableOpacity>
        ) : null }
        
        <TouchableOpacity style={[styles.toolButton, { marginLeft: 4 }]} onPress={handleMorePress}>
          <View ref={moreButtonRef} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <MoreVertical color="#333" size={20} />
          </View>
        </TouchableOpacity>

        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.dropdownOverlay} 
            activeOpacity={1} 
            onPress={() => setDropdownVisible(false)}
          >
            <View style={[styles.dropdownMenu, { top: dropdownPosition.top, right: dropdownPosition.right }]}>
              <TouchableOpacity 
                style={[styles.dropdownItem, downloadDisabled && { opacity: 0.45 }]}
                onPress={() => {
                  if (downloadDisabled) return;
                  setDropdownVisible(false);
                  onDownload && onDownload();
                }}
                disabled={downloadDisabled}
              >
                <DownloadIcon color={downloadDisabled ? '#9CA3AF' : '#3363AD'} size={18} />
                <Text style={styles.dropdownText}>Bika</Text>
              </TouchableOpacity>
              
              {/* <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleTabSelect('faq')}
              >
                <HelpCircle color="#3363AD" size={18} />
                <Text style={styles.dropdownText}>Ibibazo byabajijwe</Text>
              </TouchableOpacity> */}
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleTabSelect('feedback')}
              >
                <HelpCircle color="#3363AD" size={18} />
                <Text style={styles.dropdownText}>Tanga igitekerezo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleTabSelect('students')}
              >
                <Users color="#3363AD" size={18} />
                <Text style={styles.dropdownText}>Abanyeshuri</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => handleTabSelect('documents')}
              >
                <FileText color="#3363AD" size={18} />
                <Text style={styles.dropdownText}>Ibitabo</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1, paddingTop: -60}}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { width: deviceWidth * 0.96, height: deviceHeight * 0.6, maxHeight: deviceHeight * 0.75 }]}> 
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0}}>
                <Text style={[styles.title, {fontSize: 18, color: '#3363AD', fontWeight: 'bold', marginRight: 12}]}> 
                  {activeTab === 'faq' ? 'Ibibazo byabajijwe' : activeTab === 'feedback' ? 'Tanga igitekerezo': activeTab === 'students' ? 'Abanyeshuri' : activeTab === 'documents' ? 'Ibitabo' : ''}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setModalVisible(false)}
                >
                  <CloseIcon size={24} color="#3363AD" />
                </TouchableOpacity>
              </View>
              {/* {activeTab === 'faq' && <FAQTab courseId={course?.id} slideId={slideId} modalMode containerStyle={{flex: 1}} />} */}
               {activeTab === 'feedback' && <FeedbackBox courseId={course?.id} slideId={slideId} modalMode containerStyle={{flex: 1}} />}
              {activeTab === 'students' && <StudentsTab courseId={course?.id} />}
              {activeTab === 'documents' && <DocumentsTab courseId={course?.id} />}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {course && currentPage ? (
        <CourseDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          course={course}
          currentPage={currentPage}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    height: 48,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  toolbarLandscape: {
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#4D81D2',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 160,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  dropdownText: {
    fontSize: 15,
    color: '#3363AD',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: '90%',
    minHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#3363AD',
    fontWeight: 'bold',
  },
});