// components/ProtectedRoute.jsx - COMPLETE FIX

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES, ROUTES } from "../utils/constants";
import { getCollection, COLLECTIONS } from "../firebase/firestore";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, authInitialized } = useAuth();
  const location = useLocation();
  const [roleConfigs, setRoleConfigs] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // ✅ Track previous values to prevent infinite loops
  const prevUserId = useRef(currentUser?.uid);
  const prevFarmId = useRef(currentUser?.farmId);
  const isMounted = useRef(true);

  const userId = currentUser?.uid || null;
  const userRole = currentUser?.role || USER_ROLES.WORKER;
  const farmId = currentUser?.farmId || null;

  const pageIdMap = useMemo(
    () => ({
      [ROUTES.DASHBOARD]: "dashboard",
      [ROUTES.GOATS]: "goats",
      [ROUTES.MILK]: "milk",
      [ROUTES.VACCINES]: "vaccines",
      [ROUTES.BREEDING]: "breeding",
      [ROUTES.PREGNANCY]: "pregnancy",
      [ROUTES.KIDDING]: "kidding",
      [ROUTES.FEED]: "feed",
      [ROUTES.MEDICATION]: "medication",
      [ROUTES.FINANCIAL]: "financial",
      [ROUTES.REPORTS]: "reports",
      [ROUTES.SETTINGS]: "settings",
      [ROUTES.USER_MANAGEMENT]: "settings",
      [ROUTES.ADD_USER]: "settings",
      [ROUTES.ROLE_PAGES]: "settings",
    }),
    [],
  );

  useEffect(() => {
    isMounted.current = true;

    const currentUserId = currentUser?.uid;
    const currentFarmId = currentUser?.farmId;

    // ✅ Skip if nothing changed
    if (
      prevUserId.current === currentUserId &&
      prevFarmId.current === currentFarmId
    ) {
      setConfigLoading(false);
      return;
    }

    prevUserId.current = currentUserId;
    prevFarmId.current = currentFarmId;

    const loadConfigs = async () => {
      if (!currentUserId || userRole === USER_ROLES.OWNER) {
        if (isMounted.current) {
          setConfigLoading(false);
        }
        return;
      }

      try {
        const configs = await getCollection(COLLECTIONS.ROLE_CONFIGS, [
          { field: "farmId", operator: "==", value: currentFarmId },
        ]);

        if (isMounted.current) {
          if (configs && configs.length > 0) {
            setRoleConfigs(configs[0]);
          } else {
            setRoleConfigs({
              [USER_ROLES.MANAGER]: ["dashboard", "goats", "milk", "feed"],
              [USER_ROLES.WORKER]: ["dashboard", "goats", "milk", "feed"],
            });
          }
          setConfigLoading(false);
        }
      } catch (error) {
        console.error("Error loading role configs:", error);
        if (isMounted.current) {
          setRoleConfigs({
            [USER_ROLES.MANAGER]: ["dashboard", "goats", "milk", "feed"],
            [USER_ROLES.WORKER]: ["dashboard", "goats", "milk", "feed"],
          });
          setConfigLoading(false);
        }
      }
    };

    loadConfigs();

    return () => {
      isMounted.current = false;
    };
  }, [currentUser?.uid, currentUser?.farmId, userRole]);

  if (!authInitialized || loading || configLoading) {
    return (
      <div className="loader-full-page">
        <div className="loader loader-medium"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const currentPath = location.pathname;

  if (userRole === USER_ROLES.OWNER) {
    return children;
  }

  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!requiredRoles.includes(userRole)) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  const pageId = pageIdMap[currentPath];

  if (userRole !== USER_ROLES.OWNER && roleConfigs && pageId) {
    const visiblePages = roleConfigs[userRole] || [];

    if (pageId === "dashboard") {
      return children;
    }

    if (!visiblePages.includes(pageId)) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  if (userRole === USER_ROLES.MANAGER) {
    const isUserManagementPage =
      currentPath.includes("/settings/users") ||
      currentPath.includes("/add-user") ||
      currentPath.includes("/settings/role-pages");

    if (isUserManagementPage) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
    return children;
  }

  if (userRole === USER_ROLES.WORKER) {
    const isSettingsPage =
      currentPath.includes("/settings") || currentPath.includes("/add-user");

    if (isSettingsPage) {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
    return children;
  }

  return children;
};

export default ProtectedRoute;
