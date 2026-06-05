import React, { useEffect, useState } from 'react';
import {Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Questionnaire from '@/components/Questionnaire';
import { getCourseById, getPretestById } from '@/services/course.api';
import { ICourse, ITest } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';


export default function PreTestScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [preTest, setPreTest] = useState<ITest | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
            const preTestResponse = await getPretestById(fetchedCourse?.preTests[0].id);
            setPreTest(preTestResponse.data);
          }
    } catch (error) {
      console.log('Error loading course or pretest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = async () => {
    try {
      Alert.alert('Isuzuma ribanziriza isomo ryakozwe neza', 'Komeza isomo', [
        {
          text: 'Komeza',
          onPress: () => {
            try {
              const firstSectionId = course?.sections && course.sections.length > 0 ? course.sections[0].id : undefined;
              router.push({ pathname: `/courses/${courseId}/chapters`, params: { sectionId: firstSectionId } });
            } catch (err) {
              console.log('Navigation after pre-test failed, falling back to chapters list', err);
              router.push(`/courses/${courseId}/chapters`);
            }
          }
        },
      ]);
    } catch (error) {
      console.log("error:", error)
      const firstSectionId = course?.sections && course.sections.length > 0 ? course.sections[0].id : undefined;
      router.push({ pathname: `/courses/${courseId}/chapters`, params: { sectionId: firstSectionId } });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course || !preTest) return null;

  return (
    <Questionnaire
      test={[preTest]}
      onComplete={handleTestComplete}
      currentPage="pre-test"
      firstHeaderSubtitle="Isuzumabumenyi"
      lastHeaderSubtitle="Isuzumabumenyi"
      resultsTitle="Ikizamini Kirarangiye!"
      resultsSubtitle="Turagushimiye — Ibisubizo byawe byakiriwe"
      cheerText="Wakoze! Urakoze cyane ku kwitabira — komereza aho 🎉"
    />
  );
}