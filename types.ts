export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classSection: string;
  photoUrl: string; // Base64 encoded image
  registeredAt: string;
}

export interface User {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'teacher';
  assignedClass?: string; // Optional: Only for teachers
}

export interface SchoolConfig {
  name: string;
  logo: string; // Base64 or URL
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT', // Useful for explicit marking if needed, though usually calculated
  PROXY_ATTEMPT = 'PROXY_ATTEMPT'
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  date: string;
  status: AttendanceStatus;
  confidence: number;
  emotion?: string;
  notes?: string;
}

export interface ScanResult {
  matchId: string | null;
  confidence: number;
  isRealPerson: boolean;
  emotion: string;
  description: string;
}

export type View = 'dashboard' | 'live' | 'students' | 'reports' | 'admin';