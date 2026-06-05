import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Star, X } from 'lucide-react-native';

interface ChapterReviewCardProps {
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  courseCoverIcon: string;
  courseTitle: string;
  ratingLabels?: string[];
  reviewCriteria?: { id: string; label: string }[];
  onSubmit: (data: {
    courseId: string;
    chapterId: string;
    chapterNumber: number;
    categoryRatings: { id: string; category: string; label: string; rating: number }[];
    comment: string;
  }) => void;
  onClose?: () => void;
  submitButtonText?: string;
}

export default function ChapterReviewCard({
  courseId,
  chapterId,
  chapterTitle,
  chapterNumber,
  courseCoverIcon,
  courseTitle,
  ratingLabels = ['Ntabwo nanyuzwe na gato', 'Ntabwo nanyuzwe', 'Biringaniye', 'Nanyuzwe', 'Nanyuzwe cyane'],
  reviewCriteria = [
    { id: '1', label: 'Ibigize iki cyigwa biteguye neza.' },
    { id: '2', label: 'Intego z’iki cyigwa zari zisobanutse.' },
    { id: '3', label: 'Iki cyigwa gifite akamaro kandi kizamfasha kunoza serivisi mpa abarwayi bangana.' },
    { id: '4', label: 'Ibishushanyo (pictures na infographics) byari bisobanutse kandi biteguye neza.' },
    { id: '5', label: 'Amashusho (videos) yari asobanutse kandi ateguye neza.' },
        { id: '6', label: 'Sisitemu iroroshye gukoresha.' },
  ],
  onSubmit,
  onClose,
  submitButtonText = 'Ohereza',
}: ChapterReviewCardProps) {
  // per-category ratings derived from reviewCriteria
  const [categoryRatings, setCategoryRatings] = useState<{ id: string; category: string; label: string; rating: number }[]>(
    reviewCriteria.map((item) => ({ id: item.id, category: item.label, label: '', rating: 0 }))
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryRating = (categoryId: string, rating: number) => {
    setCategoryRatings(prev => prev.map(c => c.id === categoryId ? { ...c, rating } : c));
  };

  const renderStars = (rating: number, onPress: (rating: number) => void, size: number = 20, showLabels: boolean = false) => {
    return [1,2,3,4,5].map(star => (
      <TouchableOpacity key={star} onPress={() => onPress(star)} activeOpacity={0.7} style={showLabels ? styles.ratingItem : undefined}>
        <Star size={size} color={rating === star ? '#FFA500' : '#4B5563'} fill={rating === star ? '#FFA500' : 'transparent'} strokeWidth={1.5} />
        {showLabels && (
          <>
            <Text style={[styles.ratingLabel, rating === star && styles.ratingLabelActive]}>{star}</Text>
            <Text style={styles.ratingDescription}>{ratingLabels[star - 1] || ''}</Text>
          </>
        )}
      </TouchableOpacity>
    ));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const unrated = categoryRatings.filter(c => c.rating === 0);
      if (unrated.length > 0) {
        alert('Nyabuneka suzuma ibice byose mbere yo kohereza');
        setIsSubmitting(false);
        return;
      }

      // calculate average rating and include as rating for backend compatibility
      const total = categoryRatings.reduce((s, c) => s + (Number(c.rating) || 0), 0);
      const avg = categoryRatings.length > 0 ? Math.round(total / categoryRatings.length) : 0;
      await onSubmit({ courseId, chapterId, chapterNumber, categoryRatings, comment, rating: avg } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 80}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView
            style={styles.container}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              )}

              <View style={styles.header}>
                {courseCoverIcon ? (
                  <Image
                    source={{ uri: courseCoverIcon }}
                    style={styles.courseImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>📘</Text>
                  </View>
                )}
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{courseTitle}</Text>
                  <Text style={styles.sectionInfo}>Isomo {chapterNumber}: {chapterTitle}</Text>
                </View>
              </View>

              <View style={styles.sectionPrompt}>
                <Text style={styles.sectionPromptText}>
                  Ugiye kurangiza isomo {chapterNumber}. Tanga igitekerezo cyawe kuri iri somo:
                </Text>
              </View>

              {/* Category ratings block */}
              <View style={styles.section}>
                {categoryRatings.map((category) => (
                  <View key={category.id} style={styles.categoryContainer}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{category.category}</Text>
                      <Text style={styles.categorySubtitle}>{category.label}</Text>
                    </View>
                    <View style={styles.categoryRating}>
                      {renderStars(category.rating, (rating) => handleCategoryRating(category.id, rating), 20, true)}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  Tanga igitekerezo cyawe kuri iri somo
                </Text>
                <TextInput
                  style={styles.commentInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Andika igitekerezo cyawe hano..."
                  placeholderTextColor="#9CA3AF"
                  value={comment}
                  onChangeText={setComment}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={isSubmitting ? 1 : 0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 32,
  },
  courseImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionPrompt: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3363AD',
  },
  sectionPromptText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 24,
  },
  categoryRatingContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  ratingItem: {
    alignItems: 'center',
    flex: 1,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  ratingLabelActive: {
    color: '#1F2937',
  },
  ratingDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 60,
  },
  criteriaSection: {
    marginBottom: 4,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#3363AD',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  categoryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryRating: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
