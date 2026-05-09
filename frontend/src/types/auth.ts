export type UserRole = "guest" | "user" | "analyst" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
