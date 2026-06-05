/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  X as CloseIcon,
  FileText, 
  ClipboardCheck, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  Lock,
  PlayCircle,
} from 'lucide-react-native';
import { ICourse } from '@/types';
import { getAttempTestById, getStudentCourseProgressByCourseId } from '@/services/course.api';
import StorageService from '@/services/storage.service';

interface CourseDrawerProps {
  visible: boolean;
  onClose: () => void;
  course: ICourse;
  currentPage: string;
}

const { width } = Dimensions.get('window');

export function CourseDrawer({ visible, onClose, course, currentPage }: CourseDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [slideAnim] = useState(new Animated.Value(-width));
  const [progress, setProgress] = useState<any | null>(null);
  const [preTestDone, setPreTestDone] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [finalTestStatus, setFinalTestStatus] = useState<any | null>(null);
  const [finalExamStatus, setFinalExamStatus] = useState<any | null>(null);
  const [pinnedSlides, setPinnedSlides] = useState<{chapterId: string, slideId: string, slideData: any}[]>([]);
  const [pinnedSlidesExpanded, setPinnedSlidesExpanded] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    setProgress(null);
    // Check pre-test attempt status
    async function checkPreTest() {
      if (course.preTests && course.preTests.length > 0 && course.preTests[0]?.id) {
        try {
          const attemptRes = await getAttempTestById(course.preTests[0].id);
          const done = Array.isArray(attemptRes.data) && attemptRes.data.some(a => a.isCompleted);
          setPreTestDone(done);
        } catch (e) {
          console.log('getAttempTestById error:', e);
          setPreTestDone(false);
        }
      } else {
        setPreTestDone(true);
      }
    }
    if (visible) checkPreTest();
  }, [visible, course.id]);

  // Load completed chapters from AsyncStorage
  useEffect(() => {
    if (visible) {
      StorageService.getCompletedChapters().then(setCompletedChapters);
      // Load pinned slides
      (async () => {
        try {
          const allPinnedSlides: {chapterId: string, slideId: string, slideData: any}[] = [];
          
          // Get all chapters in the course
          for (const section of course.sections || []) {
            for (const chapter of section.chapters || []) {
              const pinnedSlidesData = await StorageService.getPinnedSlides(course.id, chapter.id);
              
              // Add each pinned slide with its data
              for (const pinnedItem of pinnedSlidesData) {
                const slideData = pinnedItem.slideData || {
                  title: 'slide title no available',
                  chapterTitle: chapter.title,
                  sectionTitle: section.title
                };
                // Add sectionNumber if not present
                if (!slideData.sectionNumber) {
                  slideData.sectionNumber = course.sections.indexOf(section) + 1;
                }
                allPinnedSlides.push({
                  chapterId: chapter.id,
                  slideId: pinnedItem.slideId,
                  slideData: slideData
                });
              }
            }
          }
          
          setPinnedSlides(allPinnedSlides);
        } catch (error) {
          console.log('Error loading pinned slides:', error);
        }
      })();
      
      // Fetch student's progress for final test/exam status
      (async () => {
        try {
          const resp = await getStudentCourseProgressByCourseId(course.id);
          if (resp && resp.data) {
            setFinalTestStatus(resp.data.finalTestStatus || null);
            setFinalExamStatus(resp.data.finalExamStatus || null);
          }
        } catch (e) {
          console.log('Error fetching progress in CourseDrawer:', e);
        }
      })();
    }
  }, [visible, course.id]);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const togglePinnedSlides = () => {
    setPinnedSlidesExpanded(!pinnedSlidesExpanded);
  };

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const isCurrentPage = (page: string) => currentPage === page;

  // Updated unlock logic for CourseDrawer
  const isChapterUnlocked = (sectionIndex: number, chapterIndex: number) => {
    if (!course) return false;
    if (sectionIndex === 0 && chapterIndex === 0) return preTestDone;
    if (chapterIndex === 0) {
      if (sectionIndex === 0) return true;
      const prev = course.sections[sectionIndex - 1];
      if (!prev) return true;
      return prev.chapters.every((c: any) => completedChapters.includes(c.id));
    }
    const section = course.sections[sectionIndex];
    const prevChapter = section.chapters[chapterIndex - 1];
    return completedChapters.includes(prevChapter.id);
  };

  const isChapterCompleted = (chapterId: string) => completedChapters.includes(chapterId);

  const onChapterPress = (sectionIndex: number, section: any, chapterId: string, chapterIndex: number) => {
    if (!isChapterUnlocked(sectionIndex, chapterIndex)) {
      Alert.alert('Iyemererwa ntiryo', 'Ubanza kurangiza igice gikurikiye mbere yo gutangira aya masomo.');
      return;
    }

    const firstChapterId = section.chapters?.[0]?.id;

    if (chapterId === firstChapterId) {
      onClose();
      router.push(`/courses/${course.id}/${chapterId}/course-content?page=1`);
      return;
    }

    onClose();
    router.push(`/courses/${course.id}/${chapterId}/course-content?page=1`);
  };

  // Add helper to get last viewed location path
  const getLastViewedLocationPath = (courseId: string) => {
    const loc = progress?.lastViewedLocation;
    if (loc && loc.courseId === courseId && loc.sectionId && loc.chapterId && loc.slideId) {
      return `/courses/${course.id}/${loc.chapterId}/course-content?page=1`;
    }
    return `/courses/${courseId}/chapters`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <CloseIcon size={20} color="#3363AD" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Access */}
              <View style={styles.quickAccess}>
                <TouchableOpacity
                  style={[
                    styles.quickItem,
                    isCurrentPage('overview') && styles.quickItemActive
                  ]}
                  onPress={() => handleNavigation(getLastViewedLocationPath(course.id))}
                >
                  <FileText size={16} color={isCurrentPage('overview') ? '#3363AD' : '#64748B'} />
                  <Text style={styles.quickText}>
                    Incamake
                  </Text>
                </TouchableOpacity>
              </View>

    

              {/* Pre-Test Card: only once, before all sections, locks all chapters/sections until done */}
              {course.preTests && course.preTests.length > 0 && course.preTests[0] && (
                <TouchableOpacity
                  style={styles.pretest}
                  activeOpacity={0.8}
                  disabled={progress && !progress.preTestDone}
                  onPress={() => {
                    onClose();
                    router.push(`/courses/${course.id}/pre-test`);
                  }}
                >
                  <ClipboardCheck size={14} color="#D97706" />
                  <Text style={styles.pretestText}>Isuzuma bushobozi</Text>
                </TouchableOpacity>
              )}

              {/* Sections: lock all until pre-test done, then unlock sequentially */}
              <View style={styles.sections}>
                <Text style={styles.sectionsTitle}>Ibice</Text>
                {course.sections.map((section, sectionIndex) => {
                  // Section unlock: first section unlocked if preTestDone, others if all chapters in previous section are completed
                  let sectionUnlocked = true;
                  if (sectionIndex === 0) {
                    sectionUnlocked = preTestDone;
                  } else {
                    const prevSection = course.sections[sectionIndex - 1];
                    sectionUnlocked = prevSection.chapters.every((ch: any) => completedChapters.includes(ch.id));
                  }
                  return (
                    <View key={section.id} style={styles.section}>
                      <TouchableOpacity
                        style={[
                          styles.sectionHeader,
                          sectionUnlocked && styles.sectionHeaderActive,
                        ]}
                        onPress={() => sectionUnlocked && toggleSection(section.id)}
                        disabled={!sectionUnlocked}
                      >
                        <View style={styles.sectionHeaderContent}>
                          <BookOpen size={16} color="#3363AD" />
                          <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>
                        {expandedSections.has(section.id) ? (
                          <ChevronDown size={16} color="#64748B" />
                        ) : (
                          <ChevronRight size={16} color="#64748B" />
                        )}
                      </TouchableOpacity>

                      {expandedSections.has(section.id) && sectionUnlocked && (
                        <View style={styles.chapters}>
                          {section.chapters.map((chapter, chapterIndex) => {
                            const chapterUnlocked = isChapterUnlocked(sectionIndex, chapterIndex);
                            const isCurrent = currentPage === chapter.id;
                            const isCompleted = isChapterCompleted(chapter.id);
                            return (
                              <TouchableOpacity
                                key={chapter.id}
                                style={[
                                  styles.chapter,
                                  isCurrent && styles.chapterActive,
                                ]}
                                onPress={() => onChapterPress(sectionIndex, section, chapter.id, chapterIndex)}
                                disabled={!chapterUnlocked}
                              >
                                <View style={styles.chapterContent}>
                                  <View style={styles.chapterIcon}>
                                    {isCompleted ? (
                                      <CheckCircle2 size={14} color="#10B981" />
                                    ) : !chapterUnlocked ? (
                                      <Lock size={14} color="#94A3B8" />
                                    ) : isCurrent ? (
                                      <PlayCircle size={14} color="#3363AD" />
                                    ) : (
                                      <BookOpen size={14} color="#64748B" />
                                    )}
                                  </View>
                                  <Text style={[
                                    styles.chapterText,
                                    !chapterUnlocked && styles.chapterTextLocked,
                                    isCompleted && styles.chapterTextCompleted,
                                    isCurrent && styles.chapterTextActive,
                                  ]}>
                                    {chapterIndex + 1}. {chapter.title}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Final Test Card: only once, after all sections, unlock only if all chapters completed */}
              {course.finalTest && course.finalTest.length > 0 && course.finalTest[0] && (
                (() => {
                  // Check if all chapters in all sections are completed using completedChapters
                  const allChapters = course.sections.flatMap((section: any) => section.chapters || []);
                  const allCompleted = allChapters.length > 0 && allChapters.every((c: any) => completedChapters.includes(c.id));
                  return (
                    <TouchableOpacity
                      style={styles.pretest}
                      activeOpacity={0.8}
                      disabled={!allCompleted}
                      onPress={() => {
                        onClose();
                        router.push(`/courses/${course.id}/final-test`);
                      }}
                    >
                      <ClipboardCheck size={14} color="#10B981" />
                      <Text style={styles.pretestText}>Isuzuma rya nyuma</Text>
                    </TouchableOpacity>
                  );
                })()
              )}

              {/* Final Exam Card: show if final test passed and other prerequisites done */}
              {course.finalExam && course.finalExam.length > 0 && course.finalExam[0] && (
                (() => {
                  const allChapters = course.sections.flatMap((section: any) => section.chapters || []);
                  const allCompleted = allChapters.length > 0 && allChapters.every((c: any) => completedChapters.includes(c.id));
                  const finalPassed = finalTestStatus && finalTestStatus.passed;
                  // Show final exam link when final test passed and chapters completed
                  const enabled = Boolean(finalPassed && allCompleted);
                  return (
                    <TouchableOpacity
                      style={[styles.pretest, enabled ? {} : { opacity: 0.6 }]}
                      activeOpacity={0.8}
                      disabled={!enabled}
                      onPress={() => {
                        onClose();
                        router.push(`/courses/${course.id}/final-exam`);
                      }}
                    >
                      <ClipboardCheck size={14} color={enabled ? '#8B5CF6' : '#94A3B8'} />
                      <Text style={[styles.pretestText, enabled ? { color: '#6B21A8' } : {}]}>Ikizamini cya nyuma (Certificate)</Text>
                    </TouchableOpacity>
                  );
                })()
              )}

              {/* Certificate Card: show if final exam passed */}
              {finalExamStatus?.passed && (
                <TouchableOpacity
                  style={[styles.pretest, { backgroundColor: '#FFFEF7', borderBottomColor: '#FFD700' }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    router.push(`/courses/${course.id}/chapters`);
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#B45309' }}>🏆</Text>
                  <Text style={[styles.pretestText, { color: '#B45309' }]}>Impamyabumenyi</Text>
                </TouchableOpacity>
              )}

                      {/* Pinned Slides */}
              {pinnedSlides.length > 0 && (
                <View style={styles.pinnedSlides}>
                  <TouchableOpacity
                    style={styles.pinnedSlidesHeader}
                    onPress={togglePinnedSlides}
                  >
                    <View style={styles.pinnedSlidesHeaderContent}>
                      <Text style={{ fontSize: 12, color: '#F59E0B', marginRight: 8 }}>📌</Text>
                      <Text style={styles.sectionsTitle}>Ibyo gusubiramo ({pinnedSlides.length})</Text>
                    </View>
                    {pinnedSlidesExpanded ? (
                      <ChevronDown size={16} color="#64748B" />
                    ) : (
                      <ChevronRight size={16} color="#64748B" />
                    )}
                  </TouchableOpacity>

                  {pinnedSlidesExpanded && (
                    <View style={styles.pinnedSlidesContent}>
                      {pinnedSlides.map((pinnedSlide, index) => (
                        <TouchableOpacity
                          key={`${pinnedSlide.chapterId}-${pinnedSlide.slideId}`}
                          style={styles.pinnedSlide}
                          onPress={() => {
                            onClose();
                            router.push(`/courses/${course.id}/${pinnedSlide.chapterId}/course-content?slideId=${pinnedSlide.slideId}`);
                          }}
                        >
                          <View style={styles.pinnedSlideContent}>
                            <View style={styles.pinIcon}>
                              <Text style={{ fontSize: 12, color: '#F59E0B' }}>📌</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pinnedSlideTitle} numberOfLines={1}>
                                Urupapuro {pinnedSlide.slideData.slideNumber} • Imbumbe {pinnedSlide.slideData.sectionNumber}
                              </Text>
                              <Text style={styles.pinnedSlideSubtitle} numberOfLines={1}>
                                {pinnedSlide.slideData.chapterTitle} 
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>

        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  quickAccess: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3363AD',
  },
  quickText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  quickTextActive: {
    color: '#3363AD',
    fontWeight: '600',
  },
  sections: {
    paddingHorizontal: 16,
  },
  sectionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  section: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  sectionHeaderActive: {
    backgroundColor: '#EFF6FF',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  chapters: {
    backgroundColor: '#FFFFFF',
  },
  pretest: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  pretestText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 8,
  },
  chapter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  chapterActive: {
    backgroundColor: '#EFF6FF',
  },
  chapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterIcon: {
    width: 20,
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    fontWeight: '400',
  },
  chapterTextLocked: {
    color: '#94A3B8',
  },
  chapterTextCompleted: {
    color: '#059669',
  },
  chapterTextActive: {
    color: '#3363AD',
    fontWeight: '500',
  },
  pinnedSlides: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  pinnedSlidesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    // marginBottom: 8,
    paddingHorizontal: 12,
  },
  pinnedSlidesHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinnedSlidesContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pinnedSlide: {
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pinnedSlideContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pinnedSlideTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  pinnedSlideSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});