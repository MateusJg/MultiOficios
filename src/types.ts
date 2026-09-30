export type UserRole = 'cliente' | 'colaborador' | 'admin';

export type ServiceStatus = 
  | 'solicitado'
  | 'fondos_en_custodia'
  | 'en_camino'
  | 'en_sitio'
  | 'en_ejecucion'
  | 'revision_calidad'
  | 'finalizado'
  | 'cancelado';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  city: string;
  neighborhood: string;
}

export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  date: string;
  comment: string;
  serviceTitle: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  completionDate: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  specialtyTitle: string;
  category: string;
  secondaryCategories: string[];
  location: LocationCoordinates;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  completedJobsCount: number;
  isVerified: boolean;
  availability: 'disponible_hoy' | 'disponible_24h' | 'en_obra' | 'pausado';
  badges: string[];
  bio: string;
  dailyRate: number; // Por Jornal (8 horas) en COP
  hourlyRate: number; // Por Hora en COP
  certifications: {
    arlRiskLevel: 'Riesgo I' | 'Riesgo II' | 'Riesgo III' | 'Riesgo IV' | 'Riesgo V';
    backgroundCheckStatus: 'Aprobado' | 'En revisión' | 'Pendiente';
    technicalDegree?: string;
    verifiedDate: string;
  };
  portfolio: PortfolioItem[];
  reviews: Review[];
  phone: string;
  email?: string;
  documentIdNumber?: string;
  approvalStatus?: 'aprobado' | 'pendiente_aprobacion' | 'rechazado';
  appliedAt?: string;
  rejectionReason?: string;
  documentsSubmitted?: {
    cedulaUploaded: boolean;
    policeCertificateUploaded: boolean;
    arlPlanillaUploaded: boolean;
    technicalDegreeUploaded: boolean;
  };
}

export interface WorkContract {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorSpecialty: string;
  collaboratorAvatar: string;
  serviceType: 'jornal' | 'por_obra' | 'horas' | 'por_horas';
  unitsCount: number; // e.g. 2 jornales or 1 obra
  baseAmount: number;
  arlInsuranceFee: number;
  platformProtectionFee: number;
  totalAmount: number;
  status: ServiceStatus;
  workDescription: string;
  location: LocationCoordinates;
  scheduledDate: string;
  scheduledTime: string;
  paymentMethod: 'pse' | 'tarjeta' | 'billetera';
  paymentTransactionId?: string;
  paymentReceiptAmount?: number;
  collaboratorDailyRate?: number;
  collaboratorHourlyRate?: number;
  isSample?: boolean;
  escrowStatus: 'fondos_retenidos' | 'liberado_al_colaborador' | 'en_disputa' | 'reembolsado';
  createdAt: string;
  progressUpdates: {
    timestamp: string;
    status: ServiceStatus;
    note: string;
    photoUrl?: string;
  }[];
  clientRating?: {
    stars: number;
    feedback: string;
    date: string;
  };
}

export interface ChatMessage {
  id: string;
  chatId?: string;
  contractId?: string;
  collaboratorId?: string;
  clientId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  imageUrl?: string;
  clientAlias?: string;
  isEncrypted: boolean;
  createdAt?: number;
}

export interface ActiveUserProfile {
  id?: string;
  role: UserRole;
  collaboratorId?: string;
  name: string;
  phone?: string;
  avatar?: string;
  specialtyTitle?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'contract' | 'payment' | 'chat' | 'system';
  read: boolean;
  contractId?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  count: number;
}
