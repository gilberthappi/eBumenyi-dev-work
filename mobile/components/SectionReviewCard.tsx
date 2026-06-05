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
import { SystemReviewCriteria } from '@/types';

interface SectionReviewCardProps {
  courseId: string;
  sectionId: string;
  sectionTitle: string;
  sectionNumber: number;
  courseCoverIcon: string; // URI string for the course cover image
  courseTitle: string;
  ratingLabels?: string[];
  reviewCriteria?: { id: string; label: string }[];
  onSubmit: (data: {
    courseId: string;
    sectionId: string;
    sectionNumber: number;
    categoryRatings: SystemReviewCriteria[];
    comment: string;
  }) => void;
  onClose?: () => void;
  submitButtonText?: string;
}

export default function SectionReviewCard({
  courseId,
  sectionId,
  sectionTitle,
  sectionNumber,
  courseCoverIcon,
  courseTitle,
    ratingLabels = ['Ntabwo nanyuzwe na gato', 'Ntabwo nanyuzwe', 'Biringaniye', 'Nanyuzwe', 'Nanyuzwe cyane'],
  reviewCriteria = [
  { id: '1', label: 'Inyigisho z\'iki gice zari zigaragara neza' },
  { id: '2', label: 'Inyigisho zashobokaga gukurikizwa byoroshye' },
  { id: '3', label: 'Ibyigirwamo muri iki gice birafasha mu buzima bwa buri munsi' },
  { id: '4', label: 'Uburyo bw\'inyigisho bwakoreshejwe bwari bwiza kandi bufasha mu gusobanukirwa' },
],
  onSubmit,
  onClose,
  submitButtonText = 'Ohereza',
}: SectionReviewCardProps) {
  // use per-category ratings
  const [categoryRatings, setCategoryRatings] = useState<SystemReviewCriteria[]>(
    reviewCriteria.map((item) => ({ id: item.id, category: item.label, label: item.label, rating: 0 }))
  );
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCategoryRating = (index: number, rating: number) => {
    setCategoryRatings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], rating };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    try {
      const total = categoryRatings.reduce((s, c) => s + (Number(c.rating) || 0), 0);
      const avg = categoryRatings.length > 0 ? Math.round(total / categoryRatings.length) : 0;

      const payload = {
        courseId,
        sectionId,
        sectionNumber,
        categoryRatings,
        comment,
        rating: avg,
      };


      try {
        await onSubmit(payload as any);
      } catch (submitError) {
        console.log('SectionReviewCard: onSubmit threw an error', submitError);
        throw submitError;
      }
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
              {/* Close Button */}
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
                    <Text style={styles.iconEmoji}>📚</Text>
                  </View>
                )}
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{courseTitle}</Text>
                  <Text style={styles.sectionInfo}>Igice {sectionNumber}: {sectionTitle}</Text>
                </View>
              </View>

              <View style={styles.sectionPrompt}>
                <Text style={styles.sectionPromptText}>
                  Ugiye kurangiza igice {sectionNumber}. Tanga igitekerezo cyawe kuri iki gice:
                </Text>
              </View>

              {/* Per-category ratings */}
              <View style={styles.categoriesContainer}>
                {categoryRatings.map((cat, idx) => (
                  <View key={cat.id} style={styles.categoryContainer}>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setCategoryRating(idx, n)}
                          activeOpacity={0.7}
                          style={styles.starButton}
                        >
                          <Star
                            size={28}
                            color={cat.rating === n ? '#FFA500' : '#E5E7EB'}
                            fill={cat.rating === n ? '#FFA500' : 'transparent'}
                            strokeWidth={1.2}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              

              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  Tanga igitekerezo cyawe kuri iki gice
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
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 4,
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
});
