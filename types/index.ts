
export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';


export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export type LoginResponse = {
  token: string;
  refresh_token: string;
  profile: Profile;
}

export type Profile = {
    id: string;
    name: string;
    email: string;
    department: string;
    year:string;
    role: UserRole;
};