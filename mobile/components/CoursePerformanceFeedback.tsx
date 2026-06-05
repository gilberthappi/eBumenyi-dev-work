import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import {  Eye, EyeOff } from 'lucide-react-native';

interface CoursePerformanceFeedbackProps {
  courseId: string;
  performanceType: 'pass' | 'fail';
  marks?: number;
  totalMarks?: number;
  showAnswers?: boolean;
  onToggleAnswers?: () => void;
  isTrainer?: boolean;
  onFeedbackDeleted?: () => void;
}

// Static feedback data
const staticFeedbackData = {
  pass: {
    message: 'Tugushimiye ku musaruro ugaragaje muri iri somo, komerezaho ku masomo akurikiye.',
  },
  fail: {
    message: 'Amanota abonetse ntago ahagije ku kigero fatizo gerageza ufate umwanya usome iri somo',
  }
};

export default function CoursePerformanceFeedback({
  courseId,
  performanceType,
  marks,
  totalMarks = 100,
  showAnswers = false,
  onToggleAnswers,
  isTrainer = false,
  onFeedbackDeleted
}: CoursePerformanceFeedbackProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  // Use static data instead of API call
  const feedbackItem = staticFeedbackData[performanceType];

  if (!feedbackItem) {
    return null;
  }

  // Dynamic colors based on performance type
  const themeColors = performanceType === 'pass' ? {
    background: '#D1FAE5', // Light green
    border: '#10B981', // Green
    headerText: '#065F46', // Dark green
    icon: '#10B981', // Green
    cardBackground: '#F0FDF4', // Very light green
    cardBorder: '#A7F3D0', // Light green border
    buttonBackground: '#10B981',
    buttonText: '#FFFFFF',
  } : {
    background: '#FEE2E2', // Light red
    border: '#EF4444', // Red
    headerText: '#991B1B', // Dark red
    icon: '#EF4444', // Red
    cardBackground: '#FEF2F2', // Very light red
    cardBorder: '#FECACA', // Light red border
    buttonBackground: '#EF4444',
    buttonText: '#FFFFFF',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
      {/* Score Display */}
      {marks !== undefined && (
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreText, { fontSize: isSmallScreen ? 18 : 20 }]}>
            Amanota: {marks} / {totalMarks}
          </Text>
          <Text style={[styles.statusText, { color: themeColors.headerText, fontSize: isSmallScreen ? 14 : 16 }]}>
            {performanceType === 'pass' ? 'WATSINZE! 🎉' : 'WATSINZWE 😔'}
          </Text>
        </View>
      )}


      {/* Feedback Card */}
      <View style={[styles.feedbackItem, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder }]}>
        <Text style={[styles.feedbackMessage, { fontSize: isSmallScreen ? 13 : 14, lineHeight: isSmallScreen ? 18 : 20 }]}>
          {feedbackItem.message}
        </Text>
      </View>

      {/* Show Answers Button */}
      {onToggleAnswers && (
        <TouchableOpacity
          style={[styles.answersButton, { backgroundColor: '#3363AD' }]}
          onPress={onToggleAnswers}
          activeOpacity={0.85}
        >
          {showAnswers ? (
            <EyeOff size={16} color="#FFFFFF" />
          ) : (
            <Eye size={16} color="#FFFFFF" />
          )}
          <Text style={[styles.answersButtonText, { color: '#FFFFFF' }]}>
            {showAnswers ? 'Funga ibisubizo' : 'Reba ibisubizo'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  feedbackItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerName: {
    fontWeight: '500',
    color: '#374151',
  },
  feedbackMessage: {
    color: '#4B5563',
    marginBottom: 8,
  },
  answersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  answersButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
});