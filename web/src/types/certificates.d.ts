// Instructor/Trainer Info
export interface InstructorInfo {
  id: string;
  name: string;
  email: string;
}

// Trainee Certificate (Course completion certificates)
export interface ITraineeCertificate {
  id: string;
  traineeId: string;
  courseId: string;
  courseName: string;
  completedDate: string;
  issueDate: string;
  expiryDate?: string;
  certificateNumber: string;
  score: number;
  certificateUrl: string;
  thumbnailUrl?: string;
  verified: boolean;
  status: "active" | "expired" | "revoked";
  instructor: InstructorInfo;
  skills: string[];
  duration: string;
  createdAt: string;
  updatedAt: string;
}

// Workshop Certificate Signature
export interface SignatureInfo {
  name: string;
  title: string;
  imageUrl?: string;
}

// Certificate Template Design
export interface CertificateTemplate {
  title: string;
  description?: string;
  backgroundImage?: string;
  customDesign?: {
    layout: "standard" | "modern" | "classic";
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      title: string;
      body: string;
    };
  };
  seals?: string[];
  signatures?: SignatureInfo[];
}

// Workshop Certificate Participant Entry
export interface CertificateParticipant {
  userId: string;
  participantName: string;
  email: string;
  completionDate: string;
  certificateNumber: string;
  certificateUrl: string;
  status: "issued" | "pending" | "revoked";
}

// Expiry Policy
export interface ExpiryPolicy {
  hasExpiry: boolean;
  expiryDays?: number;
}

// Workshop Certificate (Builder/Workshop certificates)
export interface IWorkshopCertificate {
  id: string;
  workshopId: string;
  workshopName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  template: CertificateTemplate;
  participants: CertificateParticipant[];
  duration: string;
  skillsAcquired: string[];
  status: "draft" | "active" | "completed" | "archived";
  isPublic: boolean;
  expiryPolicy?: ExpiryPolicy;
}

// Filter/Search options
export interface CertificateFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
}

// API Response types
export interface CertificateListResponse {
  data: ITraineeCertificate[] | IWorkshopCertificate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CertificateResponse {
  data: ITraineeCertificate | IWorkshopCertificate;
  message: string;
}
