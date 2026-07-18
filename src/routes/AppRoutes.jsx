// routes/AppRoutes.jsx - FIXED

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROUTES, USER_ROLES } from "../utils/constants";

// Lazy load pages
const Login = React.lazy(() => import("../pages/auth/Login"));
const Register = React.lazy(() => import("../pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("../pages/auth/ResetPassword"));
const Dashboard = React.lazy(() => import("../pages/dashboard/Dashboard"));
const Purchases = React.lazy(() => import("../pages/goats/Purchases"));
const Goats = React.lazy(() => import("../pages//goats/Goats"));
const Milk = React.lazy(() => import("../pages/milk/Milk"));
const Breeding = React.lazy(() => import("../pages/breeding/Breeding"));
const Pregnancy = React.lazy(() => import("../pages/breeding/Pregnancy"));
const Kidding = React.lazy(() => import("../pages/breeding/Kidding"));
const Medication = React.lazy(() => import("../pages/health/Medication"));
const Financial = React.lazy(() => import("../pages/finance/Financial"));
const Reports = React.lazy(() => import("../pages/finance/Reports"));
const Settings = React.lazy(() => import("../pages/settings/Settings"));
const PalaiGoats = React.lazy(() => import("../pages/goats/PalaiGoats"));
const UserManagement = React.lazy(() =>
  import("../pages/settings/UserManagement"),
);
const PalaiPackages = React.lazy(() => import("../pages/palai/PalaiPackages"));
const RolePages = React.lazy(() => import("../pages/settings/RolePages"));
const FeedMix = React.lazy(() => import("../pages/feed/FeedMix"));
const FeedAssignment = React.lazy(() => import("../pages/feed/FeedAssignment"));
const WeightTracking = React.lazy(() => import("../pages/feed/WeightTracking"));
const Inventory = React.lazy(() => import("../pages/feed/Inventory"));
const VaccineManagement = React.lazy(() =>
  import("../pages/health/VaccineManagement"),
);
const GoatVaccinations = React.lazy(() =>
  import("../pages/health/GoatVaccinations"),
);

// ✅ FIX: Memoize the routes to prevent unnecessary re-renders
const AppRoutes = React.memo(() => {
  return (
    <React.Suspense
      fallback={
        <div className="loader-full-page">
          <div className="loader loader-medium"></div>
        </div>
      }
    >
      <Routes>
        {/* Auth Routes */}
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="/palai-packages"
            element={
              <ProtectedRoute requiredRole={[USER_ROLES.OWNER]}>
                <PalaiPackages />
              </ProtectedRoute>
            }
          />
         
          <Route
            path={ROUTES.PALAI_GOATS}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <PalaiGoats />
              </ProtectedRoute>
            }
          />

          {/* Worker accessible pages */}
          <Route path={ROUTES.GOATS} element={<Goats />} />
          <Route path={ROUTES.PURCHASES} element={<Purchases />} />
          <Route path={ROUTES.MILK} element={<Milk />} />
          <Route path={ROUTES.INVENTORY} element={<Inventory />} />
          <Route
            path="/feed-mixes"
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <FeedMix />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed-assignments"
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <FeedAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weight-tracking"
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <WeightTracking />
              </ProtectedRoute>
            }
          />
          {/* Vaccine Routes */}
          <Route
            path={ROUTES.VACCINE_MANAGEMENT}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <VaccineManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.GOAT_VACCINATIONS}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <GoatVaccinations />
              </ProtectedRoute>
            }
          />

          {/* Manager + Owner accessible pages */}

          <Route
            path={ROUTES.BREEDING}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Breeding />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PREGNANCY}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Pregnancy />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.KIDDING}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Kidding />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.MEDICATION}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Medication />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.FINANCIAL}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Financial />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.REPORTS}
            element={
              <ProtectedRoute
                requiredRole={[USER_ROLES.OWNER, USER_ROLES.MANAGER]}
              >
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Settings - Only Owner */}
          <Route
            path={ROUTES.SETTINGS}
            element={
              <ProtectedRoute requiredRole={[USER_ROLES.OWNER]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* User Management - Only Owner */}
          <Route
            path={ROUTES.USER_MANAGEMENT}
            element={
              <ProtectedRoute requiredRole={[USER_ROLES.OWNER]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ROLE_PAGES}
            element={
              <ProtectedRoute requiredRole={[USER_ROLES.OWNER]}>
                <RolePages />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ADD_USER}
            element={
              <ProtectedRoute requiredRole={[USER_ROLES.OWNER]}>
                <Navigate to={ROUTES.USER_MANAGEMENT} replace />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </React.Suspense>
  );
});

export default AppRoutes;
