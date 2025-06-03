import React, { useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { LoginRequest, LoginResponse, SignupRequest } from "@/types";
import authService from "@/service/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LoginResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const authData = await authService.getCurrentUser();
        if (authData) {
          setProfile(authData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const showToast = (type: "success" | "error", title: string, message: string) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
    });
  };

  const signIn = async (loginData: LoginRequest) => {
    try {
      console.log("Attempting to log in with data:", loginData);
      const authData = await authService.login(loginData);
      setProfile(authData as LoginResponse);
      setIsAuthenticated(true);

      showToast("success", "Welcome back!", "You have successfully logged in.");
    } catch (error: any) {
      showToast("error", "Login failed", error.response?.data?.message || "An error occurred during login");
      throw error;
    }
  };

  const signUp = async (signupData: SignupRequest) => {
    try {
      const authData = await authService.signup(signupData);
      setProfile(authData as LoginResponse);
      setIsAuthenticated(true);

      showToast("success", "Welcome!", "Your account has been created.");
    } catch (error: any) {
      showToast("error", "Sign up failed", error.response?.data?.message || "An error occurred during sign up");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setProfile(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      showToast("error", "Sign out failed", error.response?.data?.message || "An error occurred during sign out");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
