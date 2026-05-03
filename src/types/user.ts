export type UserRole = 'admin' | 'encargado' | 'empleado';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
