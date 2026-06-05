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

interface CourseReviewCardProps {
  courseId: string;
  courseCoverIcon: string; // URI string for the course cover image
  courseTitle: string;
  ratingLabels?: string[];
  reviewCriteria?: { id: string; label: string }[];
  onSubmit: (data: {
    courseId: string;
    categoryRatings: { id: string; category: string; label: string; rating: number }[];
    comment: string;
  }) => void;
  onClose?: () => void;
  submitButtonText?: string;
}

export default function CourseReviewCard({
  courseId,
  courseCoverIcon,
  courseTitle,
    ratingLabels = ['Ntabwo nanyuzwe na gato', 'Ntabwo nanyuzwe', 'Biringaniye', 'Nanyuzwe', 'Nanyuzwe cyane'],
  reviewCriteria = [
    { id: '1', label: ' ikigamijwe ku masomo kirumvikana' },
    { id: '2', label: 'amasomo ateguye neza kandi aragaragara' },
    { id: '3', label: 'ibyigirwamo ndabyifashisha mubuzima busanzwe ' },
    { id: '4', label: 'ubufasha n\'uburyo bw\'imyigire biramfasha' },
  ],
  onSubmit,
  onClose,
  submitButtonText = 'Submit',
}: CourseReviewCardProps) {
  // convert incoming reviewCriteria into categoryRatings with category and label
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
      // validate
      const unrated = categoryRatings.filter(c => c.rating === 0);
      if (unrated.length > 0) {
        alert('Nyabuneka suzuma ibice byose mbere yo kohereza');
        setIsSubmitting(false);
        return;
      }
      await onSubmit({ courseId, categoryRatings, comment });
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
                <Text style={styles.iconEmoji}>👥</Text>
              </View>
            )}
            <Text style={styles.title}>{courseTitle}</Text>
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
            Mu magambo yawe tanga igitekerezo cyawe
          </Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder=""
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
    marginBottom: 24,
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
  title: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    textAlign: 'left',
    flex: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  categoryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryRating: {
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
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    backgroundColor: '#4267B2',
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
