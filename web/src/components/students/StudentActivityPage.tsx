// StudentActivityPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentById } from '@/services/students.service';

// Interface for API response structure
interface SlideFeedbackDetail {
  id: string;
  message: string;
  comment?: string;
  createdAt?: string;
  feedbackDate?: string;
  slideInfo?: {
    slideNumber: number;
    chapterTitle: string;
    courseTitle: string;
    sectionTitle: string;
  };
}

interface ChapterReviewDetail {
  reviewId: string;
  rating: number;
  comment: string;
  reviewDate: string;
  chapterInfo: {
    chapterId: string;
    chapterTitle: string;
    chapterNumber: number;
    sectionTitle: string;
    courseTitle: string;
  };
  categoryRatings: CategoryRating[];
}

interface SectionReviewDetail {
  reviewId: string;
  rating: number;
  comment: string;
  reviewDate: string;
  sectionInfo?: {
    sectionTitle: string;
    courseTitle: string;
  };
  categoryRatings: CategoryRating[];
}

interface CourseReviewDetail {
  reviewId: string;
  rating: number;
  comment: string;
  reviewDate: string;
  courseInfo: {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
  };
  categoryRatings: CategoryRating[];
}

interface SystemReviewDetail {
  reviewId: string;
  rating?: number;
  overallRating?: number;
  comment?: string;
  feedback?: string;
  recommendation?: string;
  reviewDate?: string;
  createdAt?: string;
  categoryRatings: CategoryRating[];
}

interface CategoryRating {
  ratingId: string;
  category: string;
  rating: number;
  ratedAt: string;
}
import { 
  Calendar, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Star,
  FileText,
  User,
  MapPin,
  Phone,
  Activity,
  MessageSquare,
} from 'lucide-react';


type ActiveTab = 'overview' | 'courses' | 'tests' | 'reviews';

const StudentActivityPage: React.FC = () => {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
console.log("student id:", studentId)
  // Fetch student data using React Query
  const { 
    data: studentResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudentById(studentId!),
    enabled: !!studentId,
    retry: 1
  });

  const studentData = studentResponse?.data;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            {error ? 'Failed to load student data' : 'Student not found'}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/students')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to chw
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    studentInfo,
    courseProgress,
    testAttempts
  } = studentData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number | null | undefined) => {
    const safeRating = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(safeRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Activity Dashboard</h1>
                <p className="text-gray-600 mt-1">Track and analyze student performance and engagement</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Last updated</p>
                <p className="font-medium">{formatDateTime(studentInfo.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src={studentInfo.photo}
                alt={studentInfo.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{studentInfo.fullName}</h2>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm">{studentInfo.gender} • {studentInfo.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {studentInfo.village}, {studentInfo.cell}, {studentInfo.sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{studentInfo.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    studentInfo.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {studentInfo.status}
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Since {formatDate(studentInfo.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl shadow-sm border p-1 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'tests', label: 'Tests', icon: FileText },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Courses</p>
                      <p className="text-3xl font-bold mt-2">{courseProgress.totalCoursesEnrolled}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-semibold text-blue-600">{courseProgress.overallProgress}</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: courseProgress.overallProgress }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Test Attempts</p>
                      <p className="text-3xl font-bold mt-2">{testAttempts.totalAttempts}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">{testAttempts.passedAttempts} Passed</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">{testAttempts.failedAttempts} Failed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-xl font-bold text-green-600">{testAttempts.successRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-3xl font-bold mt-2">{(testAttempts.averageScore || 0).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Accuracy</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${testAttempts.averageScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{(testAttempts.averageScore || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engagement</p>
                      <p className="text-3xl font-bold mt-2">{studentData?.feedbacksAndReviews?.feedbackAnalytics?.engagementLevel || 0}%</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Feedback Given</span>
                      <span className="font-semibold text-yellow-600">
                        {studentData?.feedbacksAndReviews?.feedbackAnalytics?.totalFeedbacksGiven || 0}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {renderStars(studentData?.feedbacksAndReviews?.feedbackAnalytics?.averageRatingGiven || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Test Types */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Test Attempts */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Test Attempts</h3>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {testAttempts.detailedAttempts.slice(0, 4).map((attempt) => (
                      <div key={attempt.attemptId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              attempt.isPassed ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">{attempt.testType}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{attempt.testInfo.course}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            attempt.isPassed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {attempt.totalMarks}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Try #{attempt.tryCount} • {formatDate(attempt.attemptDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Type Distribution */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Type Distribution</h3>
                  <div className="space-y-6">
                    {Object.entries(testAttempts.attemptsByType).map(([type, count]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {type.replace(/([A-Z])/g, ' $1').trim()} Tests
                          </span>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              type === 'preTests' ? 'bg-blue-500' :
                              type === 'midTests' ? 'bg-yellow-500' :
                              type === 'finalTests' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}
                            style={{ 
                              width: `${(count / testAttempts.totalAttempts) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Enrolled Courses</h3>
                <p className="text-gray-600 mt-1">
                  {courseProgress.totalCoursesEnrolled} course{courseProgress.totalCoursesEnrolled !== 1 ? 's' : ''} enrolled
                </p>
              </div>
              <div className="divide-y">
                {courseProgress.enrolledCourses.map((course) => (
                  <div key={course.courseId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-shrink-0">
                        <img
                          src={course.courseCoverIcon}
                          alt={course.courseTitle}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{course.courseTitle}</h4>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {course.courseDescription}
                            </p>
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                {renderStars(course.courseRating)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                Enrolled {formatDate(course.enrollmentDate)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                Last updated {formatDate(course.lastUpdated)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Progress</p>
                                <p className="text-xl font-bold text-blue-600">{course.progress}</p>
                              </div>
                              <div className={`p-2 rounded-full ${
                                course.isCompleted 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {course.isCompleted ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : (
                                  <Clock className="w-6 h-6" />
                                )}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              course.isCompleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.isCompleted ? 'Completed' : 'In Progress'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              {/* Test Summary */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{testAttempts.totalAttempts}</div>
                    <div className="text-sm text-gray-600">Total Attempts</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{testAttempts.passedAttempts}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{testAttempts.failedAttempts}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{(testAttempts.averageScore || 0).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                </div>
              </div>

              {/* Detailed Test Attempts */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Detailed Test Attempts</h3>
                {testAttempts.detailedAttempts.map((attempt) => (
                  <div key={attempt.attemptId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Attempt Header */}
                    <div className="p-6 border-b bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {attempt.testInfo.course} - {attempt.testType}
                          </h4>
                          <p className="text-gray-600 mt-1">{attempt.testInfo.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Try #{attempt.tryCount}</span>
                            <span>•</span>
                            <span>{formatDateTime(attempt.attemptDate)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className={`text-xl font-bold ${
                              attempt.isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {attempt.totalMarks}%
                            </div>
                            <div className="text-xs text-gray-600">Score</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-xl font-bold text-blue-600">
                              {attempt.correctAnswers}/{attempt.questionsAnswered}
                            </div>
                            <div className="text-xs text-gray-600">Correct</div>
                          </div>
                          <div className={`px-4 py-2 rounded-lg font-medium ${
                            attempt.isPassed 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attempt.isPassed ? 'PASSED' : 'FAILED'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Questions Details */}
                    <div className="p-6">
                      <h5 className="text-md font-semibold text-gray-900 mb-4">Question-by-Question Analysis</h5>
                      <div className="space-y-6">
                        {attempt.questionsWithAnswers?.map((question, qIndex) => (
                          <div key={question.questionId} className={`border rounded-lg p-4 ${
                            question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}>
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-3">
                              <h6 className="font-medium text-gray-900 flex-1">
                                <span className="text-sm text-gray-500 mr-2">Q{qIndex + 1}.</span>
                                {question.question}
                              </h6>
                              <div className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
                                question.isCorrect 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {question.isCorrect ? `✓ +${question.marksAwarded}` : '✗ +0'}
                              </div>
                            </div>

                            {/* Question Image */}
                            {question.questionImage && (
                              <img 
                                src={question.questionImage} 
                                alt="Question" 
                                className="max-w-sm rounded-lg mb-3"
                              />
                            )}

                            {/* Answer Options */}
                            <div className="space-y-2 mb-3">
                              {question.availableOptions.map((option) => {
                                const isCorrect = question.correctAnswers.some(correct => correct.label === option.label);
                                const isSelected = question.studentSelectedAnswers.includes(option.label);
                                
                                return (
                                  <div key={option.id} className={`p-3 rounded border ${
                                    isCorrect && isSelected 
                                      ? 'border-green-400 bg-green-100'
                                      : isSelected && !isCorrect
                                      ? 'border-red-400 bg-red-100'
                                      : isCorrect
                                      ? 'border-green-200 bg-green-50'
                                      : 'border-gray-200 bg-gray-50'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded"></div>
                                        )}
                                      </div>
                                      <span className="flex-1">{option.label}</span>
                                      {isCorrect && (
                                        <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                                      )}
                                      {isSelected && !isCorrect && (
                                        <span className="text-red-600 text-sm font-medium">✗ Selected</span>
                                      )}
                                    </div>
                                    {option.image && (
                                      <img 
                                        src={option.image} 
                                        alt={option.label} 
                                        className="max-w-xs rounded mt-2"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Feedback Statement */}
                            {question.feedbackStatement && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-sm text-blue-800">
                                  <strong>Feedback:</strong> {question.feedbackStatement}
                                </div>
                              </div>
                            )}

                            {/* Answer Summary */}
                            <div className="mt-3 text-sm text-gray-600">
                              <div className="flex flex-wrap gap-4">
                                <span>
                                  <strong>Correct Answer(s):</strong> {question.correctAnswers.map(a => a.label).join(', ')}
                                </span>
                                <span>
                                  <strong>Student Answer(s):</strong> {question.studentSelectedAnswers.length > 0 ? question.studentSelectedAnswers.join(', ') : 'No answer selected'}
                                </span>
                                <span>
                                  <strong>Answered:</strong> {formatDateTime(question.answeredAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Reviews Overview */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Reviews & Feedback</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {studentData?.feedbacksAndReviews?.slideFeedbacks?.totalFeedbacks || 0}
                    </div>
                    <p className="text-sm text-gray-600">Slide Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {studentData?.feedbacksAndReviews?.chapterReviews?.totalReviews || 0}
                    </div>
                    <p className="text-sm text-gray-600">Chapter Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {studentData?.feedbacksAndReviews?.sectionReviews?.totalReviews || 0}
                    </div>
                    <p className="text-sm text-gray-600">Section Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 mb-2">
                      {studentData?.feedbacksAndReviews?.courseReviews?.totalReviews || 0}
                    </div>
                    <p className="text-sm text-gray-600">Course Reviews</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {studentData?.feedbacksAndReviews?.systemReviews?.totalReviews || 0}
                    </div>
                    <p className="text-sm text-gray-600">System Reviews</p>
                  </div>
                </div>
              </div>

              {/* Slide Reviews */}
              {studentData?.feedbacksAndReviews?.slideFeedbacks?.feedbackDetails && studentData.feedbacksAndReviews.slideFeedbacks.feedbackDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Slide Reviews</h3>
                    <p className="text-gray-600 mt-1">Feedback on specific slides within chapters</p>
                  </div>
                  <div className="divide-y">
                    {studentData.feedbacksAndReviews.slideFeedbacks.feedbackDetails.map((slideFeedback: SlideFeedbackDetail) => (
                      <div key={slideFeedback.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm text-gray-500">
                                {formatDate(slideFeedback.createdAt || slideFeedback.feedbackDate || new Date().toISOString())}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Slide #{slideFeedback.slideInfo?.slideNumber || 'N/A'} - {slideFeedback.slideInfo?.chapterTitle || 'Unknown Chapter'}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Course: {slideFeedback.slideInfo?.courseTitle || 'Unknown Course'} | 
                              Section: {slideFeedback.slideInfo?.sectionTitle || 'Unknown Section'}
                            </p>
                            <p className="text-gray-700">{slideFeedback.message || slideFeedback.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapter Reviews */}
              {studentData?.feedbacksAndReviews?.chapterReviews?.reviewDetails && studentData.feedbacksAndReviews.chapterReviews.reviewDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Chapter Reviews</h3>
                    <p className="text-gray-600 mt-1">Detailed feedback on course chapters</p>
                  </div>
                  <div className="divide-y">
                    {studentData.feedbacksAndReviews.chapterReviews.reviewDetails.map((chapterReview: ChapterReviewDetail) => (
                      <div key={chapterReview.reviewId} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {renderStars(chapterReview.rating)}
                              <span className="text-sm text-gray-500">
                                {formatDate(chapterReview.reviewDate)}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Chapter: {chapterReview.chapterInfo.chapterTitle}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Course: {chapterReview.chapterInfo.courseTitle} | Section: {chapterReview.chapterInfo.sectionTitle}
                            </p>
                            <p className="text-gray-700">{chapterReview.comment}</p>
                          </div>
                        </div>
                        
                        {/* Category Ratings */}
                        {chapterReview.categoryRatings && chapterReview.categoryRatings.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">Category Ratings</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {chapterReview.categoryRatings.map((categoryRating: CategoryRating) => (
                                <div key={categoryRating.ratingId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-600">{categoryRating.category}</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < categoryRating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">({categoryRating.rating})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Reviews */}
              {studentData?.feedbacksAndReviews?.sectionReviews?.reviewDetails && studentData.feedbacksAndReviews.sectionReviews.reviewDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Section Reviews</h3>
                    <p className="text-gray-600 mt-1">Feedback on course sections</p>
                  </div>
                  <div className="divide-y">
                    {studentData.feedbacksAndReviews.sectionReviews.reviewDetails.map((sectionReview: SectionReviewDetail) => (
                      <div key={sectionReview.reviewId} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {renderStars(sectionReview.rating)}
                              <span className="text-sm text-gray-500">
                                {formatDate(sectionReview.reviewDate)}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Section: {sectionReview.sectionInfo?.sectionTitle || 'Unknown Section'}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Course: {sectionReview.sectionInfo?.courseTitle || 'Unknown Course'}
                            </p>
                            <p className="text-gray-700">{sectionReview.comment}</p>
                          </div>
                        </div>
                        
                        {/* Category Ratings */}
                        {sectionReview.categoryRatings && sectionReview.categoryRatings.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">Category Ratings</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {sectionReview.categoryRatings.map((categoryRating: CategoryRating) => (
                                <div key={categoryRating.ratingId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-600">{categoryRating.category}</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < categoryRating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">({categoryRating.rating})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Reviews */}
              {studentData?.feedbacksAndReviews?.courseReviews?.reviewDetails && studentData.feedbacksAndReviews.courseReviews.reviewDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Course Reviews</h3>
                    <p className="text-gray-600 mt-1">Overall feedback on completed courses</p>
                  </div>
                  <div className="divide-y">
                    {studentData.feedbacksAndReviews.courseReviews.reviewDetails.map((courseReview: CourseReviewDetail) => (
                      <div key={courseReview.reviewId} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {renderStars(courseReview.rating)}
                              <span className="text-sm text-gray-500">
                                {formatDate(courseReview.reviewDate)}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Course: {courseReview.courseInfo.courseTitle}
                            </h4>
                            <p className="text-gray-700">{courseReview.comment}</p>
                          </div>
                        </div>
                        
                        {/* Category Ratings */}
                        {courseReview.categoryRatings && courseReview.categoryRatings.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">Course Category Ratings</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {courseReview.categoryRatings.map((categoryRating: CategoryRating) => (
                                <div key={categoryRating.ratingId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-600">{categoryRating.category}</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < categoryRating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">({categoryRating.rating})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Reviews */}
              {studentData?.feedbacksAndReviews?.systemReviews?.reviewDetails && studentData.feedbacksAndReviews.systemReviews.reviewDetails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">System Reviews</h3>
                    <p className="text-gray-600 mt-1">Overall feedback about the learning platform</p>
                  </div>
                  <div className="divide-y">
                    {studentData.feedbacksAndReviews.systemReviews.reviewDetails.map((systemReview: SystemReviewDetail) => (
                      <div key={systemReview.reviewId} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {renderStars(systemReview.overallRating || systemReview.rating)}
                              <span className="text-sm text-gray-500">
                                {formatDate(systemReview.reviewDate || systemReview.createdAt || new Date().toISOString())}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2">Platform Feedback</h4>
                            <p className="text-gray-700 mb-2">{systemReview.feedback || systemReview.comment}</p>
                            {systemReview.recommendation && (
                              <p className="text-sm text-gray-600">
                                <strong>Recommendation:</strong> {systemReview.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* System Category Ratings */}
                        {systemReview.categoryRatings && systemReview.categoryRatings.length > 0 && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">System Category Ratings</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {systemReview.categoryRatings.map((categoryRating: CategoryRating) => (
                                <div key={categoryRating.ratingId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-600">{categoryRating.category}</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < categoryRating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">({categoryRating.rating})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Reviews Message */}
              {(!studentData?.feedbacksAndReviews?.slideFeedbacks?.feedbackDetails?.length && 
                !studentData?.feedbacksAndReviews?.chapterReviews?.reviewDetails?.length && 
                !studentData?.feedbacksAndReviews?.sectionReviews?.reviewDetails?.length && 
                !studentData?.feedbacksAndReviews?.courseReviews?.reviewDetails?.length && 
                !studentData?.feedbacksAndReviews?.systemReviews?.reviewDetails?.length) && (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
                  <p className="text-gray-600">
                    This student hasn't provided any reviews or feedback yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentActivityPage;