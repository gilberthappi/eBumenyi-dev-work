import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { Test } from '@/types/course';

interface TestComponentProps {
  test: Test;
  onComplete: (answers: Record<string, string[]>) => void;
}

export function TestComponent({ test, onComplete }: TestComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const currentQuestion = test.questionnaires[currentQuestionIndex];
  const totalQuestions = test.questionnaires.length;

  const handleOptionSelect = (optionId: string) => {
    const questionId = currentQuestion.id;
    const currentAnswers = answers[questionId] || [];

    if (currentQuestion.allowMultiple) {
      // Multiple selection
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswers,
      }));
    } else {
      // Single selection
      setAnswers(prev => ({
        ...prev,
        [questionId]: [optionId],
      }));
    }
  };

  const handleNext = () => {
    const questionId = currentQuestion.id;
    const questionAnswers = answers[questionId] || [];

    if (questionAnswers.length === 0) {
      Alert.alert('Please select an answer', 'You must select at least one option before proceeding.');
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isOptionSelected = (optionId: string) => {
    const questionAnswers = answers[currentQuestion.id] || [];
    return questionAnswers.includes(optionId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                isOptionSelected(option.id) && styles.selectedOption
              ]}
              onPress={() => handleOptionSelect(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                {isOptionSelected(option.id) ? (
                  <CheckCircle size={20} color="#3B82F6" />
                ) : (
                  <Circle size={20} color="#64748B" />
                )}
                <Text style={[
                  styles.optionText,
                  isOptionSelected(option.id) && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.previousButton]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.disabledButtonText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  questionCounter: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#475569',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1E293B',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: '#F8FAFC',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#94A3B8',
  },
});