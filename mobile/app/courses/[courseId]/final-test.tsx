import React, { useEffect, useState, useRef } from 'react';
import { Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Questionnaire from '@/components/Questionnaire';
import { getCourseById, getFinalTestById, addCoursereview, getStudentCourseProgressByCourseId } from '@/services/course.api';
import { ICourse, ITest } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CourseReviewCard from '@/components/CourseReviewCard';
import StorageService from '@/services/storage.service';

export default function FinalTestScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [finalTest, setFinalTest] = useState<ITest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, string[]> | null>(null);
  const questionnaireRef = useRef<any>(null);

  // Course review status helper
  const storeCourseReviewStatus = async (courseId: string, isReviewed: boolean) => {
    await StorageService.storeCourseReviewStatus(courseId, isReviewed);
  };

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourse = async () => {
    try {
      if (courseId) {
        const response = await getCourseById(courseId as string);
        const fetchedCourse = response.data;
        setCourse(fetchedCourse);
        const finalTestResponse = await getFinalTestById(fetchedCourse.finalTest[0].id);
        setFinalTest(finalTestResponse.data);
      }
    } catch (error) {
      console.log('Error loading course or finaltest:', error);
    } finally {
      setLoading(false);
    }
  };

  // Called when Questionnaire is completed
  const handleTestComplete = async (testAnswers: Record<string, string[]>) => {
    // Instead of showing results, show review modal
    console.log('handleTestComplete called, showing review modal');
    setPendingAnswers(testAnswers);
    setShowReviewModal(true);
  };

  // Called after review is submitted
  const handleReviewSubmit = async (reviewData: any) => {
    console.log('Review submitted:', reviewData);
    
    try {
      // Submit review to backend
      await addCoursereview({
        courseId: reviewData.courseId,
        comment: reviewData.comment,
        categoryRatings: reviewData.reviewCriteria,
        rating: reviewData.rating
      });
      
      console.log('Review successfully submitted to backend');
      
      // Mark course as reviewed locally
      if (courseId) {
        await storeCourseReviewStatus(courseId as string, true);
        console.log('Course marked as reviewed locally');
      }
      
      setShowReviewModal(false);
    } catch (error) {
      console.log('Error submitting review:', error);
      // Still close modal and mark as reviewed locally even if backend fails
      setShowReviewModal(false);
      if (courseId) {
        await storeCourseReviewStatus(courseId as string, true);
      }
    }
    
    // Show results/marks in Questionnaire first
    if (questionnaireRef.current && questionnaireRef.current.showResults) {
      questionnaireRef.current.showResults();
    }
    
    // Navigate to chapters after a short delay to show results
    setTimeout(async () => {
      try {
        // Get latest progress and decide next destination
        const progressResp = await getStudentCourseProgressByCourseId(courseId as string);

        // If final exam is available, navigate there; otherwise go to first incomplete section
        const courseResp = await getCourseById(courseId as string);
        const course = courseResp.data;

        if (course.finalExam && Array.isArray(course.finalExam) && course.finalExam.length > 0) {
          // Navigate to final exam page
          router.push(`/courses/${courseId}/final-exam`);
          return;
        }

        // Otherwise fallback to previous behavior: find first incomplete section
        let nextSectionId = null;
        if (progressResp.data && progressResp.data.chapterProgress) {
          nextSectionId = course.sections[0]?.id;
          outer: for (const section of course.sections) {
            for (const ch of section.chapters) {
              const completed = progressResp.data.chapterProgress.find((cp: any) => cp.chapterId === ch.id && cp.isCompleted);
              if (!completed) {
                nextSectionId = section.id;
                break outer;
              }
            }
          }
        }

        router.push({ pathname: `/courses/${courseId}/chapters`, params: { sectionId: nextSectionId } });
      } catch (e) {
        console.log('Failed to navigate after review submission', e);
      }
    }, 2000); // 2 second delay to show results
  };

  if (loading) return <LoadingSpinner />;
  if (!course || !finalTest) return null;

  return (
    <>
      <Questionnaire
        ref={questionnaireRef}
        test={finalTest ? [finalTest] : []}
        onComplete={handleTestComplete}
        currentPage="final-test"
        firstHeaderSubtitle="Ikizamini gisoza isomo"
        lastHeaderSubtitle="Ikizamini gisoza isomo"
        resultsTitle="Ikizamini Kirarangiye!"
        resultsSubtitle="Turagushimiye — Ibisubizo byawe byakiriwe"
        cheerText="Wakoze! Urakoze cyane ku kwitabira — komereza aho 🎉"
        showResultsExternally={!!pendingAnswers && !showReviewModal}
      />
      <Modal visible={showReviewModal} animationType="slide" transparent={false}>
        <CourseReviewCard
          courseId={courseId as string}
          courseCoverIcon={course.coverIcon}
          courseTitle={course.title}
          submitButtonText="Ohereza"
          onSubmit={handleReviewSubmit}
          onClose={() => setShowReviewModal(false)}
        />
      </Modal>
    </>
  );
}
