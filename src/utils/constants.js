// utils/constants.js - COMPLETE WITH ALL ROUTES

export const APP_NAME = "Goat Manager";
export const APP_VERSION = "v2.0";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/",
  GOATS: "/goats",
  PURCHASES: "/purchases",
  MILK: "/milk",
  VACCINES: "/vaccines",
  BREEDING: "/breeding",
  PREGNANCY: "/pregnancy",
  KIDDING: "/kidding",
  MEDICATION: "/medication",
  FINANCIAL: "/financial",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  USER_MANAGEMENT: "/settings/users",
  ADD_USER: "/settings/users/add",
  ROLE_PAGES: "/settings/role-pages",
  VACCINE_MANAGEMENT: "/vaccine-management",
  GOAT_VACCINATIONS: "/goat-vaccinations",
  INVENTORY: "/inventory",
  FEED_MIXES: "/feed-mixes",
  FEED_ASSIGNMENTS: "/feed-assignments",
  WEIGHT_TRACKING: "/weight-tracking", // ✅ Added missing route
  FEED: "/feed", // ✅ Added feed route
  VACCINES_PAGE: "/vaccines",
  PALAI_PACKAGES: "/palai-packages", // ✅ Added vaccines page route
  PALAI_GOATS: "/palai-goats",
};

// 👇 USER ROLES
export const USER_ROLES = {
  OWNER: "Owner",
  MANAGER: "Manager",
  WORKER: "Worker",
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: {
    canManageUsers: true,
    canManageFarm: true,
    canViewAllPages: true,
    canDeleteData: true,
  },
  [USER_ROLES.MANAGER]: {
    canManageUsers: false,
    canManageFarm: false,
    canViewAllPages: true,
    canDeleteData: false,
  },
  [USER_ROLES.WORKER]: {
    canManageUsers: false,
    canManageFarm: false,
    canViewAllPages: false,
    canDeleteData: false,
  },
};

// Worker accessible pages
export const WORKER_ACCESSIBLE_PAGES = [
  ROUTES.DASHBOARD,
  ROUTES.GOATS,
  ROUTES.PURCHASES,
  ROUTES.MILK,
];

// Manager accessible pages (all except user management)
export const MANAGER_ACCESSIBLE_PAGES = [
  ROUTES.DASHBOARD,
  ROUTES.GOATS,
  ROUTES.MILK,
  ROUTES.VACCINES,
  ROUTES.BREEDING,
  ROUTES.PREGNANCY,
  ROUTES.KIDDING,
  ROUTES.MEDICATION,
  ROUTES.FINANCIAL,
  ROUTES.REPORTS,
];

export const VACCINE_STATUS = {
  HEALTHY: "healthy",
  DUE: "due",
  OVERDUE: "overdue",
};

export const TRANSACTION_TYPES = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

export const GOAT_SEX = {
  FEMALE: "Female",
  MALE: "Male",
};

export const MILK_TIMES = {
  MORNING: "Morning",
  EVENING: "Evening",
};

export const GOAT_SOURCE_TYPES = {
  HOMEBRED: "HomeBred",
  PURCHASED: "Purchased",
};

export const GOAT_HEALTH_STATUS = {
  HEALTHY: "Healthy",
  PREGNANT: "Pregnant",
  LACTATING: "Lactating",
  DRY: "Dry",
  SOLD: "Sold",
  DEAD: "Dead",
  QUARANTINE: "Quarantine",
};

export const GOAT_STATUS = {
  HEALTHY: "Healthy",
  PREGNANT: "Pregnant",
  LACTATING: "Lactating",
  DRY: "Dry",
  SOLD: "Sold",
  DEAD: "Dead",
  QUARANTINE: "Quarantine",
};

export const GOAT_STAGE = {
  KID: "Kid",
  DOE: "Doe",
  BUCK: "Buck",
};

export const PURCHASE_TYPES = {
  LOCAL: "Local",
  IMPORTED: "Imported",
};

// ============================
// FEED RELATED CONSTANTS
// ============================

export const FEED_CATEGORIES = {
  CONCENTRATE: "Concentrate",
  FORAGE: "Forage",
  MINERAL: "Mineral",
  SUPPLEMENT: "Supplement",
  HAY: "Hay",
  SILAGE: "Silage",
  GRAIN: "Grain",
  PROTEIN: "Protein",
};

export const FEED_UNITS = {
  KG: "kg",
  G: "g",
  LB: "lb",
  TONS: "tons",
};

export const FEED_NUTRIENT_TYPES = {
  PROTEIN: "protein",
  ENERGY: "energy",
  FIBER: "fiber",
  FAT: "fat",
  CALCIUM: "calcium",
  PHOSPHORUS: "phosphorus",
};

export const FEEDING_TIMES = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

export const DEFAULT_FEED_PERCENTAGE = 3; // 3% of body weight

export const FEED_MIX_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
};
// ============================
// PALAI PACKAGE CONSTANTS
// ============================
export const PALAI_PACKAGES = {
  PREMIUM: "Premium",
  STANDARD: "Standard",
};

export const PALAI_PACKAGE_DEFAULTS = {
  [PALAI_PACKAGES.PREMIUM]: [
    { fieldName: "Fodder", value: "Included" },
    { fieldName: "Special Wanda", value: "Included" },
    { fieldName: "Milk/lassi daily", value: "Included" },
    { fieldName: "Seasonal oil & butter", value: "Included" },
    { fieldName: "Supplements/vitamins", value: "Included" },
    { fieldName: "Grooming, exercise care", value: "Included" },
    { fieldName: "Cleaning Supplies", value: "Included" },
    { fieldName: "Vet Visit", value: "Included" },
    { fieldName: "Misc (meds, deworming, etc.)", value: "Included" },
  ],
  [PALAI_PACKAGES.STANDARD]: [
    { fieldName: "Fodder", value: "Included" },
    { fieldName: "Wanda", value: "Included" },
    { fieldName: "Milk/lassi 4x (once a week)", value: "Included" },
    { fieldName: "Cleaning Supplies", value: "Included" },
    { fieldName: "Vet Visit", value: "Included" },
    { fieldName: "Misc (meds, deworming, etc.)", value: "Included" },
  ],
};