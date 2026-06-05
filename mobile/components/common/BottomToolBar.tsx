import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minimize, Expand, RotateCcw } from 'lucide-react-native';

interface Props {
  onPrev?: () => void;
  nextButtonText?: string;
  onNext?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  currentPage?: number;
  totalPages?: number;
  reset?: () => void;
  onToggleOrientation?: () => void;
  isLandscape?: boolean;
  showQuestionnaire?: boolean;
  onCancelQuestionnaire?: () => void;
  onSubmitQuestionnaire?: () => void;
  canSubmitQuestionnaire?: boolean;
  isLastQuestion?: boolean;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  answers?: any;
  hasCurrentAnswer?: boolean;
  feedbackModalOpen?: boolean;
}

export default function BottomToolBar({
  onPrev,
  nextButtonText = 'Komeza',
  onNext,
  onZoomIn,
  onZoomOut,
  currentPage = 1,
  totalPages = 1,
  reset,
  onToggleOrientation,
  isLandscape,
  showQuestionnaire = false,
  onCancelQuestionnaire,
  onSubmitQuestionnaire,
  canSubmitQuestionnaire = false,
  isLastQuestion = false,
  currentQuestionIndex = 0,
  totalQuestions = 0,
  answers,
  hasCurrentAnswer = false,
  feedbackModalOpen = false,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width > 700;

  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      paddingVertical: isTablet ? 14 : isSmallScreen ? 6 : 10,
      paddingHorizontal: isTablet ? 16 : isSmallScreen ? 4 : 10,
    },
    button: {
      ...styles.button,
      paddingHorizontal: isTablet ? 14 : isSmallScreen ? 2 : 4,
      paddingVertical: isTablet ? 10 : isSmallScreen ? 4 : 6,
      borderRadius: isTablet ? 10 : 8,
    },
    questionnaireButton: {
      ...styles.questionnaireButton,
      paddingHorizontal: isTablet ? 16 : isSmallScreen ? 8 : 12,
      paddingVertical: isTablet ? 12 : isSmallScreen ? 6 : 8,
      borderRadius: isTablet ? 10 : 8,
    },
    label: {
      ...styles.label,
      fontSize: isTablet ? 14 : isSmallScreen ? 9 : 10,
      marginLeft: isSmallScreen ? 2 : 4,
    },
    questionnaireLabel: {
      ...styles.questionnaireLabel,
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      marginLeft: isSmallScreen ? 4 : 6,
    },
    pageText: {
      ...styles.pageText,
      fontSize: isTablet ? 18 : isSmallScreen ? 13 : 15,
      marginHorizontal: isTablet ? 12 : 8,
    },
    questionnaireTitle: {
      ...styles.questionnaireTitle,
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    },
    toolButton: {
      ...styles.toolButton,
      width: isTablet ? 36 : isSmallScreen ? 24 : 28,
      height: isTablet ? 36 : isSmallScreen ? 24 : 28,
      borderRadius: isTablet ? 18 : isSmallScreen ? 12 : 14,
    },
  });

  // If in questionnaire mode, show different UI
  if (showQuestionnaire) {
    // Hide toolbar in landscape as before
    if (isLandscape) return null;

    const onBack = onPrev || onCancelQuestionnaire;
    const onForward = onNext || onSubmitQuestionnaire;
    const disabled = !hasCurrentAnswer || feedbackModalOpen;

    return (
      <View style={dynamicStyles.container}>
        <TouchableOpacity
          style={[dynamicStyles.questionnaireButton, feedbackModalOpen ? styles.submitButtonDisabled : styles.nextButton]}
          onPress={() => {
            if (feedbackModalOpen) return;
            if (typeof onBack === 'function') {
              // call async to avoid gesture conflicts
              setTimeout(() => { try { onBack(); } catch (e) { console.warn('onBack error', e); } }, 0);
            } else {
              console.warn('BottomToolBar: onBack / onCancelQuestionnaire handler is not provided');
            }
          }}
          disabled={feedbackModalOpen}
          accessibilityState={{ disabled: feedbackModalOpen }}
          accessibilityRole="button"
          activeOpacity={feedbackModalOpen ? 1 : 0.8}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <ChevronLeft color={feedbackModalOpen ? '#ccc' : '#fff'} size={isTablet ? 22 : isSmallScreen ? 16 : 18} />
          <Text style={feedbackModalOpen ? styles.submitLabelDisabled : styles.nextLabel}>Inyuma</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[dynamicStyles.questionnaireButton, disabled ? styles.submitButtonDisabled : styles.nextButton]}
          onPress={() => {
            if (disabled) return;
            if (typeof onForward === 'function') {
              setTimeout(() => { try { onForward(); } catch (e) { console.warn('onForward error', e); } }, 0);
            } else {
              console.warn('BottomToolBar: onNext / onSubmitQuestionnaire handler is not provided');
            }
          }}
          disabled={disabled}
          accessibilityState={{ disabled }}
          accessibilityRole="button"
          activeOpacity={disabled ? 1 : 0.8}
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        >
          <Text style={disabled ? styles.submitLabelDisabled : styles.nextLabel}>Imbere</Text>
          <ChevronRight color={disabled ? '#ccc' : '#fff'} size={isTablet ? 22 : isSmallScreen ? 16 : 18} />
        </TouchableOpacity>
      </View>
    );
  }

  // Regular document viewer mode
  if (isLandscape) return null;
  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity style={styles.resetButton}>
        <TouchableOpacity 
          style={[dynamicStyles.toolButton, { marginLeft: 0 }]} 
          onPress={reset}
        >
          <RotateCcw color="#333" size={isTablet ? 22 : isSmallScreen ? 16 : 18} />
        </TouchableOpacity>
      </TouchableOpacity>

      <TouchableOpacity style={dynamicStyles.button} onPress={onPrev} disabled={currentPage <= 1}>
        <ChevronLeft color={currentPage <= 1 ? '#ccc' : '#3363AD'} size={isTablet ? 26 : isSmallScreen ? 18 : 22} />
        <Text style={dynamicStyles.label}>Inyuma</Text>
      </TouchableOpacity>

      <TouchableOpacity style={dynamicStyles.button} onPress={onZoomOut}>
        <ZoomOut color="#3363AD" size={isTablet ? 26 : isSmallScreen ? 18 : 22} />
      </TouchableOpacity>

      <Text style={dynamicStyles.pageText} numberOfLines={1}>{currentPage}/{totalPages}</Text>

      <TouchableOpacity style={dynamicStyles.button} onPress={onZoomIn}>
        <ZoomIn color="#3363AD" size={isTablet ? 26 : isSmallScreen ? 18 : 22} />
      </TouchableOpacity>

      <TouchableOpacity style={dynamicStyles.button} onPress={onNext} disabled={currentPage >= totalPages}>
        <Text style={dynamicStyles.label}>Imbere</Text>
        <ChevronRight color={currentPage >= totalPages ? '#ccc' : '#3363AD'} size={isTablet ? 26 : isSmallScreen ? 18 : 22} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.trendButton}>
        {onToggleOrientation ? (
          <TouchableOpacity 
            style={[dynamicStyles.toolButton, { marginLeft: 4 }]} 
            onPress={onToggleOrientation}
          >
            {isLandscape ? (
              <Minimize color="#333" size={isTablet ? 22 : isSmallScreen ? 16 : 18} />
            ) : (
              <Expand color="#333" size={isTablet ? 22 : isSmallScreen ? 16 : 18} />
            )}
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 2,
  },
  questionnaireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  label: {
    color: '#3363AD',
    fontWeight: '600',
  },
  questionnaireLabel: {
    fontWeight: '600',
  },
  pageText: {
    color: '#333',
    fontWeight: '700',
  },
  questionnaireTitle: {
    color: '#3363AD',
    fontWeight: '700',
    textAlign: 'center',
  },
  questionnaireTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    marginLeft: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    marginRight: 4,
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  // Questionnaire specific styles
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelLabel: {
    color: '#DC2626',
  },
  nextButton: {
    backgroundColor: '#3363AD',
    borderWidth: 1,
    borderColor: '#3363AD',
  },
  nextLabel: {
    color: '#FFFFFF',
  },
  nextLabelDisabled: {
    color: '#9CA3AF',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#059669',
  },
  submitButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  submitLabel: {
    color: '#FFFFFF',
  },
  submitLabelDisabled: {
    color: '#9CA3AF',
  },
});