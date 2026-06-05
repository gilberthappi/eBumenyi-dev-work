import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  QUIZ_RESULTS: 'quiz_results',
  CHAPTER_PROGRESS: 'chapter_progress',
  COURSE_REVIEWS: 'course_reviews',
  SECTION_REVIEWS: 'section_reviews',
};

export interface QuizResult {
  chapterId: string;
  courseId: string;
  results: ResultItem[];
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface ResultItem {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

class StorageService {
  // Store quiz results
  async storeQuizResults(results: QuizResult): Promise<void> {
    try {
      const existingResults = await this.getQuizResults();
      const updatedResults = {
        ...existingResults,
        [results.chapterId]: results
      };
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(updatedResults));
    } catch (error) {
      console.log('Error storing quiz results:', error);
      throw error;
    }
  }

  // Get all quiz results
  async getQuizResults(): Promise<{ [chapterId: string]: QuizResult }> {
    try {
      const results = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      return results ? JSON.parse(results) : {};
    } catch (error) {
      console.log('Error getting quiz results:', error);
      return {};
    }
  }

  // Get quiz results for a specific chapter
  async getChapterQuizResults(chapterId: string): Promise<QuizResult | null> {
    try {
      const results = await this.getQuizResults();
      return results[chapterId] || null;
    } catch (error) {
      console.log('Error getting chapter quiz results:', error);
      return null;
    }
  }

  // Clear quiz results for a chapter
  async clearChapterResults(chapterId: string): Promise<void> {
    try {
      const results = await this.getQuizResults();
      delete results[chapterId];
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
    } catch (error) {
      console.log('Error clearing chapter results:', error);
      throw error;
    }
  }

  // Clear all quiz results
  async clearAllResults(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.QUIZ_RESULTS);
    } catch (error) {
      console.log('Error clearing all results:', error);
      throw error;
    }
  }

  // Mark a chapter as completed
  async markChapterCompleted(chapterId: string): Promise<void> {
    try {
      const key = 'completed_chapters';
      const data = await AsyncStorage.getItem(key);
      let completed: string[] = data ? JSON.parse(data) : [];
      if (!completed.includes(chapterId)) {
        completed.push(chapterId);
        await AsyncStorage.setItem(key, JSON.stringify(completed));
      }
    } catch (error) {
      console.log('Error marking chapter as completed:', error);
      throw error;
    }
  }

  // Get all completed chapters
  async getCompletedChapters(): Promise<string[]> {
    try {
      const key = 'completed_chapters';
      const data = await AsyncStorage.getItem(key);
      const result = data ? JSON.parse(data) : [];
      console.log('💾 getCompletedChapters from storage:', result);
      return result;
    } catch (error) {
      console.log('Error getting completed chapters:', error);
      return [];
    }
  }

  // Check if a chapter is completed
  async isChapterCompleted(chapterId: string): Promise<boolean> {
    const completed = await this.getCompletedChapters();
    return completed.includes(chapterId);
  }

  // Course Review Status Methods
  async getCourseReviewStatus(courseId: string, isStudentReviewedCourse?: boolean): Promise<boolean> {
    try {
      // If backend flag is provided and true, return true (already reviewed on backend)
      if (isStudentReviewedCourse === true) {
        return true;
      }

      // Check local storage for review status
      const key = `course_review_${courseId}`;
      const reviewData = await AsyncStorage.getItem(key);
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        return parsed.isReviewed || false;
      }
      return false;
    } catch (error) {
      console.log('Error getting course review status:', error);
      return false;
    }
  }

  async storeCourseReviewStatus(courseId: string, isReviewed: boolean): Promise<void> {
    try {
      const key = `course_review_${courseId}`;
      const reviewData = {
        isReviewed,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(reviewData));
    } catch (error) {
      console.log('Error storing course review status:', error);
      throw error;
    }
  }

  async clearCourseReviewStatus(courseId: string): Promise<void> {
    try {
      const key = `course_review_${courseId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error clearing course review status:', error);
      throw error;
    }
  }

  // System Review Status Methods
  async getSystemReviewStatus(): Promise<boolean> {
    try {
      const key = 'system_review_status';
      const reviewData = await AsyncStorage.getItem(key);
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        return parsed.isSystemReviewed || false;
      }
      return false;
    } catch (error) {
      console.log('Error getting system review status:', error);
      return false;
    }
  }

  async storeSystemReviewStatus(isReviewed: boolean): Promise<void> {
    try {
      const key = 'system_review_status';
      const reviewData = {
        isSystemReviewed: isReviewed,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(reviewData));
    } catch (error) {
      console.log('Error storing system review status:', error);
      throw error;
    }
  }

  async clearSystemReviewStatus(): Promise<void> {
    try {
      const key = 'system_review_status';
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error clearing system review status:', error);
      throw error;
    }
  }

  // Section Review Status Methods
  async getSectionReviewStatus(courseId: string, sectionId: string): Promise<boolean> {
    try {
      const key = `section_review_${courseId}_${sectionId}`;
      const reviewData = await AsyncStorage.getItem(key);
      console.log(`🔍 getSectionReviewStatus for ${key}:`, reviewData);
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        const isReviewed = parsed.isReviewed || false;
        console.log(`📝 Section ${sectionId} review status:`, isReviewed);
        return isReviewed;
      }
      console.log(`📝 Section ${sectionId} has no review data - returning false`);
      return false;
    } catch (error) {
      console.log('Error getting section review status:', error);
      return false;
    }
  }

  async storeSectionReviewStatus(courseId: string, sectionId: string, sectionNumber: number, reviewData: {
    rating: number;
    reviewCriteria: string[];
    comment: string;
  }): Promise<void> {
    try {
      const key = `section_review_${courseId}_${sectionId}`;
      const sectionReviewData = {
        isReviewed: true,
        sectionNumber,
        rating: reviewData.rating,
        reviewCriteria: reviewData.reviewCriteria,
        comment: reviewData.comment,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(sectionReviewData));
    } catch (error) {
      console.log('Error storing section review status:', error);
      throw error;
    }
  }

  async clearSectionReviewStatus(courseId: string, sectionId: string): Promise<void> {
    try {
      const key = `section_review_${courseId}_${sectionId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error clearing section review status:', error);
      throw error;
    }
  }

  // Get all section reviews for a course
  async getSectionReviewsForCourse(courseId: string): Promise<{ [sectionId: string]: any }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sectionReviewKeys = allKeys.filter(key => key.startsWith(`section_review_${courseId}_`));
      
      const sectionReviews: { [sectionId: string]: any } = {};
      
      for (const key of sectionReviewKeys) {
        const sectionId = key.replace(`section_review_${courseId}_`, '');
        const reviewData = await AsyncStorage.getItem(key);
        if (reviewData) {
          sectionReviews[sectionId] = JSON.parse(reviewData);
        }
      }
      
      return sectionReviews;
    } catch (error) {
      console.log('Error getting section reviews for course:', error);
      return {};
    }
  }

  // Clear all section reviews for a course (for testing purposes)
  async clearAllSectionReviewsForCourse(courseId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sectionReviewKeys = allKeys.filter(key => key.startsWith(`section_review_${courseId}_`));
      
      for (const key of sectionReviewKeys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log(`Cleared ${sectionReviewKeys.length} section reviews for course: ${courseId}`);
    } catch (error) {
      console.log('Error clearing all section reviews for course:', error);
      throw error;
    }
  }

  // Debug helper to log all section review statuses for a course
  async logSectionReviewStatus(courseId: string): Promise<void> {
    try {
      const sectionReviews = await this.getSectionReviewsForCourse(courseId);
      console.log(`Section review status for course ${courseId}:`, sectionReviews);
    } catch (error) {
      console.log('Error logging section review status:', error);
    }
  }

  // ===== Chapter Review Status Methods (mirrors section methods) =====
  async getChapterReviewStatus(courseId: string, chapterId: string): Promise<boolean> {
    try {
      const key = `chapter_review_${courseId}_${chapterId}`;
      const reviewData = await AsyncStorage.getItem(key);
      console.log(`🔍 getChapterReviewStatus for ${key}:`, reviewData);
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        const isReviewed = parsed.isReviewed || false;
        console.log(`📝 Chapter ${chapterId} review status:`, isReviewed);
        return isReviewed;
      }
      console.log(`📝 Chapter ${chapterId} has no review data - returning false`);
      return false;
    } catch (error) {
      console.log('Error getting chapter review status:', error);
      return false;
    }
  }

  async storeChapterReviewStatus(chapterId: string, reviewData: {
    rating: number;
    reviewCriteria: string[];
    comment: string;
  }): Promise<void> {
    try {
      const key = `chapter_review_${chapterId}`;
      const chapterReviewData = {
        isReviewed: true,
        rating: reviewData.rating,
        reviewCriteria: reviewData.reviewCriteria,
        comment: reviewData.comment,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(key, JSON.stringify(chapterReviewData));
    } catch (error) {
      console.log('Error storing chapter review status:', error);
      throw error;
    }
  }

  async clearChapterReviewStatus(courseId: string, chapterId: string): Promise<void> {
    try {
      const key = `chapter_review_${courseId}_${chapterId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error clearing chapter review status:', error);
      throw error;
    }
  }

  // Get all chapter reviews for a course
  async getChapterReviewsForCourse(courseId: string): Promise<{ [chapterId: string]: any }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const chapterReviewKeys = allKeys.filter(key => key.startsWith(`chapter_review_${courseId}_`));
      
      const chapterReviews: { [chapterId: string]: any } = {};
      
      for (const key of chapterReviewKeys) {
        const chapterId = key.replace(`chapter_review_${courseId}_`, '');
        const reviewData = await AsyncStorage.getItem(key);
        if (reviewData) {
          chapterReviews[chapterId] = JSON.parse(reviewData);
        }
      }
      
      return chapterReviews;
    } catch (error) {
      console.log('Error getting chapter reviews for course:', error);
      return {};
    }
  }

  // Clear all chapter reviews for a course (for testing purposes)
  async clearAllChapterReviewsForCourse(courseId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const chapterReviewKeys = allKeys.filter(key => key.startsWith(`chapter_review_${courseId}_`));
      
      for (const key of chapterReviewKeys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log(`Cleared ${chapterReviewKeys.length} chapter reviews for course: ${courseId}`);
    } catch (error) {
      console.log('Error clearing all chapter reviews for course:', error);
      throw error;
    }
  }

  // Pinned Slides Methods
  async pinSlide(courseId: string, chapterId: string, slideId: string, slideData?: any): Promise<void> {
    try {
      const key = `pinned_slides_${courseId}_${chapterId}`;
      const data = await AsyncStorage.getItem(key);
      let pinned: {slideId: string, slideData?: any}[] = data ? JSON.parse(data) : [];
      const existingIndex = pinned.findIndex(item => item.slideId === slideId);
      
      if (existingIndex === -1) {
        pinned.push({ slideId, slideData });
        await AsyncStorage.setItem(key, JSON.stringify(pinned));
      } else if (slideData) {
        // Update slide data if provided
        pinned[existingIndex].slideData = slideData;
        await AsyncStorage.setItem(key, JSON.stringify(pinned));
      }
    } catch (error) {
      console.log('Error pinning slide:', error);
      throw error;
    }
  }

  async unpinSlide(courseId: string, chapterId: string, slideId: string): Promise<void> {
    try {
      const key = `pinned_slides_${courseId}_${chapterId}`;
      const data = await AsyncStorage.getItem(key);
      let pinned: {slideId: string, slideData?: any}[] = data ? JSON.parse(data) : [];
      pinned = pinned.filter(item => item.slideId !== slideId);
      await AsyncStorage.setItem(key, JSON.stringify(pinned));
    } catch (error) {
      console.log('Error unpinning slide:', error);
      throw error;
    }
  }

  async getPinnedSlides(courseId: string, chapterId: string): Promise<{slideId: string, slideData?: any}[]> {
    try {
      const key = `pinned_slides_${courseId}_${chapterId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error getting pinned slides:', error);
      return [];
    }
  }

  async isSlidePinned(courseId: string, chapterId: string, slideId: string): Promise<boolean> {
    const pinned = await this.getPinnedSlides(courseId, chapterId);
    return pinned.some(item => item.slideId === slideId);
  }
}

export default new StorageService();