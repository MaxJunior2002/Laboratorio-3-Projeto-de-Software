export type UserRole = "STUDENT" | "PROFESSOR" | "PARTNER_COMPANY";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  profileId: string;
  walletId: string | null;
  sessionId: string;
}
