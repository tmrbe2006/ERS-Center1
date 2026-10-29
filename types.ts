
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  USER = 'user',
  RESPONDER = 'responder'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  contact?: string;
  country?: string;
  ip?: string;
  lastLocation?: { lat: number; lng: number; accuracy?: number; timestamp: number; isLiveShift?: boolean };
  shiftStatus?: 'on-duty' | 'off-duty';
  lastShiftStart?: number;
  lastShiftEnd?: number;
  lastHeartbeat?: number;
  status?: 'online' | 'idle' | 'offline';
  lastLogin?: number;
  deviceInfo?: {
    type: 'mobile' | 'desktop' | 'tablet';
    model: string;
    browser: string;
    os: string;
  };
}

export interface SimulatorConfig {
  customSituations: string;
  updatedAt: number;
}

export interface FacilityProfile {
  activityType: string;
  potentialHazards: string;
  criticalAssets: string;
  safetyStandards: string;
  siteDescription: string;
  updatedAt: number;
}

export interface TelemetryPoint {
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export interface EmergencyEvent {
  id: string;
  type: 'message' | 'task' | 'arrival' | 'escalation';
  content: string;
  userName: string;
  timestamp: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  emergencyId: string;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface Emergency {
  id: string;
  typeId: string;
  typeName: string;
  locationId: string;
  locationName: string;
  notes?: string;
  createdBy: string;
  creatorName: string;
  createdAt: number;
  status: EmergencyStatus;
  responders: string[];
  responderActions?: Record<string, string>;
  dismissedBy?: string[];
  closedAt?: number;
  closedBy?: string;
  closedByName?: string;
  aiReport?: string;
  escalated?: boolean;
  checklist?: SOPTask[];
  isStreaming?: boolean;
  verifiedResponders?: string[];
  quiz?: Quiz;
}

export enum EmergencyStatus {
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export interface SOPTask {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
}

export interface Location {
  id: string;
  name: string;
  floor_number: string;
  coords: { lat: number; lng: number };
  verificationCode?: string;
}

export interface JobTitle {
  id: string;
  job_name: string;
  description: string;
}

export interface Settings {
  darkMode: boolean;
  language: 'en' | 'ar';
  translationLanguage: string;
  doNotDisturb: {
    enabled: boolean;
    start: string;
    end: string;
  };
  themeColor: string;
  muteSiren: boolean;
}

export interface AppLinks {
  androidUrl: string;
  iosUrl: string;
  lastUpdated?: number;
}

export interface EmergencyType {
  id: string;
  type_name: string;
  description: string;
  severity_level: 'High' | 'Medium' | 'Low';
  alert_color: string;
  default_procedures: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  loginTime: number;
  logoutTime?: number;
  device?: string;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type DeviceLocationSource = 'gps' | 'ip' | 'manual' | 'none';
export type DeviceLocationStatus = 'active' | 'stale' | 'approximate' | 'failed';

export interface ConnectedDevice {
  deviceId: string;
  installationId: string;
  userId: string;
  userName?: string;
  sessionId: string;
  deviceName: string;
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  fcmToken: string;
  notificationEnabled: boolean;
  ipAddress: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  locationSource: DeviceLocationSource;
  locationAccuracy: number;
  locationStatus: DeviceLocationStatus;
  locationObservedAt: number;
  locationUpdatedAt: number;
  locationVersion: number;
  lastIpCheckAt: number;
  lastKnownCountry: string;
  lastKnownCity: string;
  activeSessionId: string;
  isOnline: boolean;
  firstSeen: number;
  lastSeen: number;
  lastLocationUpdate: number;
}

export interface LocationHistoryEntry {
  id?: string;
  deviceId: string;
  userId: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  locationSource: DeviceLocationSource;
  locationAccuracy: number;
  locationStatus: DeviceLocationStatus;
  timestamp: number;
  reason?: string;
}

