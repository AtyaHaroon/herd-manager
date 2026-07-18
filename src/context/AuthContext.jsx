// context/AuthContext.jsx - COMPLETE FIX

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  resetPassword as firebaseResetPassword,
  loginWithGoogle,
  onAuthStateChange,
} from "../firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: Setting up auth listener...");
    const unsubscribe = onAuthStateChange((user) => {
      console.log("AuthProvider: Auth state changed:", user?.uid || "null");
      setCurrentUser(user);
      setLoading(false);
      setAuthInitialized(true);
    });
    return () => {
      console.log("AuthProvider: Cleaning up auth listener...");
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        console.log("AuthContext: Starting login...");

        if (!authInitialized) {
          console.log("AuthContext: Waiting for auth initialization...");
          await new Promise((resolve) => {
            const checkInit = setInterval(() => {
              if (authInitialized) {
                clearInterval(checkInit);
                resolve();
              }
            }, 100);
          });
        }

        const user = await loginWithEmail(email, password);
        console.log("AuthContext: Login successful:", user?.uid);

        await new Promise((resolve) => setTimeout(resolve, 500));
        return user;
      } catch (error) {
        console.error("AuthContext: Login error:", error);
        throw error;
      }
    },
    [authInitialized],
  );

  const register = useCallback(
    async (email, password, displayName, contact, role = "Owner") => {
      try {
        const user = await registerWithEmail(
          email,
          password,
          displayName,
          contact,
          "Owner",
        );
        return user;
      } catch (error) {
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await firebaseResetPassword(email);
    } catch (error) {
      throw error;
    }
  }, []);

  const loginWithGoogleProvider = useCallback(async () => {
    try {
      const user = await loginWithGoogle();
      return user;
    } catch (error) {
      throw error;
    }
  }, []);

  // ✅ FIX: Use useMemo with deep comparison
  const value = useMemo(
    () => ({
      currentUser,
      login,
      register,
      logout,
      resetPassword,
      loginWithGoogleProvider,
      isAuthenticated: !!currentUser,
      loading,
      authInitialized,
    }),
    [
      currentUser,
      loading,
      authInitialized,
      login,
      register,
      logout,
      resetPassword,
      loginWithGoogleProvider,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
