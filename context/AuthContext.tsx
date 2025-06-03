/* eslint-disable @typescript-eslint/no-explicit-any */

import { LoginRequest, LoginResponse, SignupRequest } from "@/types";
import { createContext } from "react";

interface AuthContextType {
  profile: LoginResponse | null;
  isReady : boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (loginData : LoginRequest) => Promise<void>;
  signUp: (signupData : SignupRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);