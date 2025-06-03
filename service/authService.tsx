import { LoginRequest, LoginResponse, SignupRequest } from "@/types";
import api from "@/service/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", credentials);
    console.log("Login response:", response);
    if (response.data.token) {
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("refresh_token", response.data.refreshToken);
    }
    return response.data;
  },

  signup: async (userData: SignupRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/signup", userData);
    if (response.data.token) {
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("refresh_token", response.data.refresh_token);
    }
    return response.data;
  },

  facultySignup: async (userData: SignupRequest): Promise<boolean> => {
    const response = await api.post("/auth/faculty/signup", userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const response = await api.post("/auth/logout");
    if (response.status === 200) {
      console.log("Logout successful");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refresh_token");
    }
  },

  getCurrentUser: async (): Promise<LoginResponse | null> => {
    try {
      const response = await api.get("/auth");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("refresh_token");
        return null;
      }
      return Promise.reject(error);
    }
  },
};

export default authService;
