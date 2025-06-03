import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext"; 

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.log("useAuth must be used within an AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};