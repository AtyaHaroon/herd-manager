// components/Layout/Sidebar.jsx - WITH LIFECYCLE LOG LINK ADDED

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES, USER_ROLES } from "../../utils/constants";
import { getCollection, COLLECTIONS } from "../../firebase/firestore";

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [roleConfigs, setRoleConfigs] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  const userRole = currentUser?.role || USER_ROLES.WORKER;

  // ✅ Category-wise menu structure
  const allMenuSections = [
    {
      title: "DASHBOARD",
      items: [{ id: "dashboard", label: "Dashboard", path: ROUTES.DASHBOARD }],
    },
    {
      title: "GOAT MANAGEMENT",
      items: [
        { id: "goats", label: "Goats", path: ROUTES.GOATS },
        { id: "purchases", label: "Purchases", path: ROUTES.PURCHASES },
        {
          id: "palai-goats",
          label: "Palai Goats",
          path: ROUTES.PALAI_GOATS,
        },
        
      ],
    },
    {
      title: "BREEDING & REPRODUCTION",
      items: [
        { id: "breeding", label: "Breeding", path: ROUTES.BREEDING },
        { id: "pregnancy", label: "Pregnancy", path: ROUTES.PREGNANCY },
        { id: "kidding", label: "Kidding", path: ROUTES.KIDDING },
      ],
    },
    {
      title: "HEALTH & VACCINES",
      items: [
        {
          id: "vaccine-management",
          label: "Vaccine Management",
          path: ROUTES.VACCINE_MANAGEMENT,
        },
        {
          id: "goat-vaccinations",
          label: "Goat Vaccinations",
          path: ROUTES.GOAT_VACCINATIONS,
        },
        { id: "medication", label: "Medication", path: ROUTES.MEDICATION },
      ],
    },
    {
      title: "FEED MANAGEMENT",
      items: [
        { id: "inventory", label: "Inventory", path: ROUTES.INVENTORY },
        { id: "feed-mixes", label: "Feed Mixes", path: ROUTES.FEED_MIXES },
        {
          id: "feed-assignments",
          label: "Feed Assignments",
          path: ROUTES.FEED_ASSIGNMENTS,
        },
      ],
    },
    {
      title: "MILK & GROWTH",
      items: [
        { id: "milk", label: "Milk", path: ROUTES.MILK },
        {
          id: "weight-tracking",
          label: "Weight Tracking",
          path: ROUTES.WEIGHT_TRACKING,
        },
      ],
    },
    {
      title: "FINANCE & REPORTS",
      items: [
        { id: "financial", label: "Financial", path: ROUTES.FINANCIAL },
        { id: "reports", label: "Reports", path: ROUTES.REPORTS },
      ],
    },
    {
      title: "SALES & MARKETING",
      items: [
        {
          id: "palai-packages",
          label: "Palai Packages",
          path: ROUTES.PALAI_PACKAGES,
          ownerOnly: true,
        },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      items: [
        {
          id: "settings",
          label: "Settings",
          path: ROUTES.SETTINGS,
          ownerOnly: true,
        },
        {
          id: "users",
          label: "User Management",
          path: ROUTES.USER_MANAGEMENT,
          ownerOnly: true,
        },
        {
          id: "role-pages",
          label: "Role Pages",
          path: ROUTES.ROLE_PAGES,
          ownerOnly: true,
        },
      ],
    },
  ];

  // Load role configurations for non-owner users
  useEffect(() => {
    const loadConfigs = async () => {
      if (!currentUser || currentUser.role === USER_ROLES.OWNER) {
        setConfigLoading(false);
        return;
      }

      try {
        const configs = await getCollection(COLLECTIONS.ROLE_CONFIGS, [
          { field: "farmId", operator: "==", value: currentUser.farmId },
        ]);

        if (configs && configs.length > 0) {
          setRoleConfigs(configs[0]);
        }
      } catch (error) {
        console.error("Error loading role configs:", error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfigs();
  }, [currentUser]);

  // ✅ Page ID map for role-based filtering
  const pageIdMap = {
    [ROUTES.DASHBOARD]: "dashboard",
    [ROUTES.GOATS]: "goats",
    [ROUTES.PURCHASES]: "purchases",
    [ROUTES.MILK]: "milk",
    [ROUTES.VACCINE_MANAGEMENT]: "vaccine-management",
    [ROUTES.GOAT_VACCINATIONS]: "goat-vaccinations",
    [ROUTES.BREEDING]: "breeding",
    [ROUTES.PREGNANCY]: "pregnancy",
    [ROUTES.KIDDING]: "kidding",
    [ROUTES.INVENTORY]: "inventory",
    [ROUTES.FEED_MIXES]: "feed-mixes",
    [ROUTES.FEED_ASSIGNMENTS]: "feed-assignments",
    [ROUTES.WEIGHT_TRACKING]: "weight-tracking",
    [ROUTES.MEDICATION]: "medication",
    [ROUTES.FINANCIAL]: "financial",
    [ROUTES.REPORTS]: "reports",
    [ROUTES.SETTINGS]: "settings",
    [ROUTES.USER_MANAGEMENT]: "users",
    [ROUTES.ROLE_PAGES]: "role-pages",
    [ROUTES.PALAI_PACKAGES]: "palai-packages",
    [ROUTES.PALAI_GOATS]: "palai-goats",
    [ROUTES.GOAT_LIFECYCLE]: "lifecycle", // ✅ Added lifecycle
  };

  const getVisibleSections = () => {
    // Owner sees everything
    if (userRole === USER_ROLES.OWNER) {
      return allMenuSections;
    }

    const visiblePageIds = roleConfigs?.[userRole] || [];

    return allMenuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // Owner-only items hide for non-owners
          if (item.ownerOnly) return false;

          if (roleConfigs) {
            const pageId = pageIdMap[item.path];
            if (pageId) {
              return visiblePageIds.includes(pageId);
            }
            return true;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  const visibleSections = getVisibleSections();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isRouteActive = (item) => {
    const currentPath = location.pathname;

    const exactMatchPages = [
      ROUTES.SETTINGS,
      ROUTES.USER_MANAGEMENT,
      ROUTES.ROLE_PAGES,
      ROUTES.DASHBOARD,
      ROUTES.VACCINE_MANAGEMENT,
      ROUTES.GOAT_VACCINATIONS,
      ROUTES.INVENTORY,
      ROUTES.FEED_MIXES,
      ROUTES.FEED_ASSIGNMENTS,
      ROUTES.WEIGHT_TRACKING,
      ROUTES.PALAI_PACKAGES,
      ROUTES.GOAT_LIFECYCLE, // ✅ Added lifecycle
    ];

    if (exactMatchPages.includes(item.path)) {
      return currentPath === item.path;
    }

    return currentPath.startsWith(item.path);
  };

  // Show loading state
  if (configLoading && userRole !== USER_ROLES.OWNER) {
    return (
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <nav style={{ padding: "20px", textAlign: "center" }}>
          <div className="loader loader-small"></div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <nav>
        {visibleSections.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => {
              const isActive = isRouteActive(item);

              return (
                <button
                  key={item.id}
                  className={isActive ? "active" : ""}
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>
          {userRole} • v2.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
