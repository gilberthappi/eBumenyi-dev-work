import httpClient from './httpClient';
import { CreateSystemReviewDto, TSystemReviewResponse } from '@/types';

class SystemReviewAPI {
  private baseURL = '/system-reviews';

  async submitSystemReview(reviewData: CreateSystemReviewDto): Promise<TSystemReviewResponse> {
    try {
      const response = await httpClient.post<TSystemReviewResponse>(this.baseURL, reviewData);
      return response.data;
    } catch (error) {
      console.log('Error submitting system review:', error);
      throw error;
    }
  }
}

export const systemReviewAPI = new SystemReviewAPI();
