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

import { Star, ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react-native';
import { assets } from '@/theme';

interface SystemReviewCriteria {
  id: string;
  category: string;
  label: string;
  rating: number;
}

interface SystemReviewCardProps {
  systemName?: string;
  onSubmit: (data: {
    overallRating: number;
    categoryRatings: SystemReviewCriteria[];
    feedback: string;
    recommendation: 'yes' | 'no';
  }) => void;
  onClose?: () => void;
  submitButtonText?: string;
  ratingLabels?: string[];
}

export default function SystemReviewCard({
  systemName ,
  onSubmit,
  onClose,
  submitButtonText = 'Ohereza Igitekerezo',
  ratingLabels = ['Sibyiza', 'Byiza gahoro', 'Biringaniye', 'Byiza', 'Byiza cyane'],
}: SystemReviewCardProps) {
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
const [categoryRatings, setCategoryRatings] = useState<SystemReviewCriteria[]>([
  { id: '1', category: 'Imikorere ya tekinike', label: 'Umuvuduko n\'ubworohe bw\'urubuga', rating: 0 },
  { id: '2', category: 'Ibikubiye mu masomo', label: 'Uburyo amasomo ateguye neza kandi asobanutse', rating: 0 },
  { id: '3', category: 'Uburyo bwo kwiga', label: 'Uburyo bwo kwiga bworoshye kandi bushimishije', rating: 0 },
  { id: '4', category: 'Gukoreshwa mu mirimo', label: "Uburyo ibyigwa bigufasha mu mirimo y'umujyanama w'ubuzima ku giti cyawe", rating: 0 },
  { id: '5', category: 'Ubushobozi bwo gusubiza', label: 'Uburyo ibyigwa bigufasha gusubiza ibibazo by\'abaganga', rating: 0 },
  { id: '6', category: 'Isuzuma n\'ibizamini', label: 'Uburyo ibizamini byategurwa n\'ibisubizo byerekana neza ibyo wize', rating: 0 },
  { id: '7', category: 'Ubufasha n\'itumanaho', label: 'Guhabwa ubufasha igihe habaye ikibazo cyangwa ikibazo cyo kwinjira', rating: 0 },
  { id: '8', category: 'Gusubiza n\'gusobanukirwa', label: 'Uburyo amanota n\'ibisubizo byerekana neza ibyo wize n\'ibyifuzwe', rating: 0 },
  { id: '9', category: 'Kugera ku masomo', label: 'Koroherezwa kubona amasomo no kuyatangira igihe cyose', rating: 0 },
  { id: '10', category: 'Igihe n\'iterambere', label: 'Uburyo amanota n\'ibisubizo bigufasha kubona iterambere ryawe mu kwiga', rating: 0 }
]);

  const handleCategoryRating = (categoryId: string, rating: number) => {
    setCategoryRatings(prev =>
      prev.map(item =>
        item.id === categoryId ? { ...item, rating } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Validate required fields
    const unratedCategories = categoryRatings.filter(cat => cat.rating === 0);
    if (unratedCategories.length > 0) {
      alert('Nyabuneka usuzume ko wasubije byose');
      return;
    }
    
    if (!recommendation) {
      alert('Nyabuneka uhitemo niba washishikariza undi muntu gukoresha urubuga');
      return;
    }
    
    if (!feedback.trim()) {
      alert('Nyabuneka wandike igitekerezo cyawe');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate overall rating from category ratings
      const totalRating = categoryRatings.reduce((sum, category) => sum + category.rating, 0);
      const averageRating = categoryRatings.length > 0 ? Math.round(totalRating / categoryRatings.length) : 0;
      
      await onSubmit({
        overallRating: averageRating,
        categoryRatings,
        feedback: feedback.trim(),
        recommendation: recommendation as 'yes' | 'no',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, onPress: (rating: number) => void, size: number = 24, showLabels: boolean = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onPress(star)} activeOpacity={0.7} style={showLabels ? styles.ratingItem : undefined}>
        <Star
          size={size}
          color={rating >= star ? '#FFA500' : '#4B5563'}
          fill={rating >= star ? '#FFA500' : 'transparent'}
          strokeWidth={1.5}
        />
        {showLabels && (
          <>
            <Text
              style={[
                styles.ratingLabel,
                rating === star && styles.ratingLabelActive,
              ]}
            >
              {star}
            </Text>
            <Text style={styles.ratingDescription}>
              {ratingLabels[star - 1] || ''}
            </Text>
          </>
        )}
      </TouchableOpacity>
    ));
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.card}>
              {/* Close Button */}
              {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Image 
                    source={assets.etrainingIcon} 
                    style={styles.systemIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>{systemName}</Text>
                  <Text style={styles.subtitle}>Duhe igitekerezo cyawe</Text>
                </View>
              </View>

            {/* Category Ratings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suzuma ibice bitandukanye <Text style={styles.required}>*</Text></Text>
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

            {/* Recommendation */}
            <View style={styles.section}>
                <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Washishikariza undi umuntu gukoresha urubuga? <Text style={styles.required}>*</Text></Text>
              </View>
              <View style={styles.recommendationContainer}>
                <TouchableOpacity
                  style={[
                    styles.recommendationButton,
                    recommendation === 'yes' && styles.recommendationButtonActive
                  ]}
                  onPress={() => setRecommendation('yes')}
                  activeOpacity={0.8}
                >
                  <ThumbsUp 
                    size={20} 
                    color={recommendation === 'yes' ? '#FFFFFF' : '#10B981'} 
                  />
                  <Text style={[
                    styles.recommendationText,
                    recommendation === 'yes' && styles.recommendationTextActive
                  ]}>
                    Yego
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.recommendationButton,
                    recommendation === 'no' && styles.recommendationButtonActiveNo
                  ]}
                  onPress={() => setRecommendation('no')}
                  activeOpacity={0.8}
                >
                  <ThumbsDown 
                    size={20} 
                    color={recommendation === 'no' ? '#FFFFFF' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.recommendationText,
                    recommendation === 'no' && styles.recommendationTextActive
                  ]}>
                    Oya
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feedback Text Area */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <MessageSquare size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>Igitekerezo cyawe cyimbitse <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.feedbackInput}
                multiline
                numberOfLines={5}
                placeholder="Andika igitekerezo cyawe hano... (Bikenewe)"
                placeholderTextColor="#9CA3AF"
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
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
    borderRadius: 20,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  systemIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryRating: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  recommendationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  recommendationButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  recommendationButtonActiveNo: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  recommendationTextActive: {
    color: '#FFFFFF',
  },
  feedbackInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4267B2',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  required: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingItem: {
    alignItems: 'center',
    flex: 1,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  ratingLabelActive: {
    color: '#1F2937',
  },
  ratingDescription: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 50,
  },
});
