import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Questionnaire from '@/components/Questionnaire';
import { getCourseById, getFinalExamById } from '@/services/course.api';
import { ICourse, ITest } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function FinalExamScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [finalTest, setFinalTest] = useState<ITest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourse = async () => {
    setLoadError(null);
    try {
      if (courseId) {
        const response = await getCourseById(courseId as string);
        const fetchedCourse = response.data;
        setCourse(fetchedCourse);
        const examMeta = fetchedCourse.finalExam?.[0];
        if (!examMeta?.id) {
          setLoadError(
            'Iri somo ntabwo rifite ikizamini gisoza cyashyizweho. Subira inyuma cyangwa uvugane n’ubuyobozi.',
          );
          return;
        }
        const finalTestResponse = await getFinalExamById(examMeta.id);
        setFinalTest(finalTestResponse.data);
      }
    } catch (error) {
      console.log('Error loading course or final exam:', error);
      setLoadError('Ntibyashobotse gufungura ikizamini gisoza. Ongera ugerageze.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Subira inyuma</Text>
        </Pressable>
      </View>
    );
  }
  if (!course || !finalTest) return null;

  return (
    <Questionnaire
      test={finalTest ? [finalTest] : []}
      onComplete={() => {}}
      currentPage="final-exam"
      firstHeaderSubtitle="Ikizamini gisoza isomo(Certificate)"
      lastHeaderSubtitle="Ikizamini gisoza isomo(Certificate)"
      resultsTitle="Ikizamini Kirarangiye!"
      resultsSubtitle="Turagushimiye — Ibisubizo byawe byakiriwe"
      cheerText="Wakoze! Urakoze cyane ku kwitabira — komereza aho 🎉"
      showResultsExternally={false}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
