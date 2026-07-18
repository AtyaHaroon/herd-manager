// src/hooks/useGoatForm.js - COMPLETE FIXED (No warnings)

import { useState, useEffect, useCallback, useRef } from "react";
import { goatService } from "../services/goatService";
import { useAuth } from "../context/AuthContext";
import {
  GOAT_STATUS,
  GOAT_STAGE,
  GOAT_SOURCE_TYPES,
  PURCHASE_TYPES,
} from "../utils/constants";

// ✅ Helper function to get stage
const getStage = (age, gender) => {
  if (age < 1) return GOAT_STAGE.KID;
  return gender === "F" ? GOAT_STAGE.DOE : GOAT_STAGE.BUCK;
};

// ✅ Calculate age from DOB - Returns age in years with decimal
const calculateAge = (dob) => {
  if (!dob) return 0;

  const birthDate = new Date(dob + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(birthDate.getTime())) return 0;

  const diffTime = today - birthDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  let ageInYears = diffDays / 365.25;

  if (ageInYears < 0) ageInYears = 0;

  return Math.round(ageInYears * 10) / 10;
};

export const useGoatForm = (initialData = null) => {
  const { currentUser } = useAuth();
  const initialFarmId = currentUser?.farmId || "";

  const [formData, setFormData] = useState({
    farmId: initialData?.farmId || initialFarmId,
    tagId: initialData?.tagId || "",
    breed: initialData?.breed || "",
    dob: initialData?.dob || "",
    age: initialData?.age || 0,
    weight: initialData?.weight || "",
    status: initialData?.status || GOAT_STATUS.HEALTHY,
    stage: initialData?.stage || GOAT_STAGE.KID,
    sourceType: initialData?.sourceType || GOAT_SOURCE_TYPES.HOMEBRED,
    isPregnant: initialData?.isPregnant || false,
    motherId: initialData?.motherId || "",
    fatherId: initialData?.fatherId || "",
    purchaseContact: initialData?.purchaseContact || "",
    purchaseDate: initialData?.purchaseDate || "",
    sellerName: initialData?.sellerName || "",
    purchasePrice: initialData?.purchasePrice || "",
    purchaseType: initialData?.purchaseType || PURCHASE_TYPES.LOCAL,
    purchaseNote: initialData?.purchaseNote || "",
    createdAt: initialData?.createdAt || new Date(),
    updatedAt: initialData?.updatedAt || new Date(),
    isActive: initialData?.isActive ?? true,
    gender: initialData?.gender || "F",
    expectedKiddingDate: initialData?.expectedKiddingDate || "",
  });

  const [parentOptions, setParentOptions] = useState({
    mothers: [],
    fathers: [],
  });
  const [loadingParents, setLoadingParents] = useState(false);
  const [tagIdError, setTagIdError] = useState("");

  const isInitializingRef = useRef(true);

  // ✅ Get dob and gender from formData for useEffect dependencies
  const { dob, gender } = formData;

  useEffect(() => {
    if (initialData) {
      isInitializingRef.current = true;
      setFormData((prev) => ({
        ...prev,
        farmId: initialData.farmId || initialFarmId,
        tagId: initialData.tagId || "",
        breed: initialData.breed || "",
        dob: initialData.dob || "",
        age: initialData.age || 0,
        weight: initialData.weight || "",
        status: initialData.status || GOAT_STATUS.HEALTHY,
        stage: initialData.stage || GOAT_STAGE.KID,
        sourceType: initialData.sourceType || GOAT_SOURCE_TYPES.HOMEBRED,
        isPregnant: initialData.isPregnant || false,
        motherId: initialData.motherId || "",
        fatherId: initialData.fatherId || "",
        purchaseContact: initialData.purchaseContact || "",
        purchaseDate: initialData.purchaseDate || "",
        sellerName: initialData.sellerName || "",
        purchasePrice: initialData.purchasePrice || "",
        purchaseType: initialData.purchaseType || PURCHASE_TYPES.LOCAL,
        purchaseNote: initialData.purchaseNote || "",
        createdAt: initialData.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: initialData.isActive ?? true,
        gender: initialData.gender || "F",
      }));
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    } else {
      isInitializingRef.current = false;
    }
  }, [initialData, initialFarmId]);

  // ✅ FIXED: Auto-calculate age from DOB with proper dependencies
  // Using dob and gender from formData object
  useEffect(() => {
    // Don't recalculate if initializing
    if (isInitializingRef.current) return;

    // Calculate age from DOB
    const finalAge = calculateAge(dob);
    const newStage = getStage(finalAge, gender);

    // ✅ Only update if values changed to avoid infinite loop
    setFormData((prev) => {
      if (prev.age === finalAge && prev.stage === newStage) {
        return prev;
      }
      console.log("✅ Age updated:", finalAge, "Stage:", newStage, "DOB:", dob);
      return {
        ...prev,
        age: finalAge,
        stage: newStage,
      };
    });
    // ✅ FIXED: Dependencies are dob and gender (primitive values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dob, gender]); // ✅ Now using dob and gender directly

  // ✅ Load parents for dropdown
  useEffect(() => {
    const fetchParents = async () => {
      if (!formData.farmId) return;
      setLoadingParents(true);
      try {
        const males = await goatService.getParentsForDropdown(
          formData.farmId,
          "M",
        );
        const females = await goatService.getParentsForDropdown(
          formData.farmId,
          "F",
        );
        setParentOptions({ fathers: males || [], mothers: females || [] });
      } catch (error) {
        console.error("Error fetching parent dropdowns:", error);
      } finally {
        setLoadingParents(false);
      }
    };
    fetchParents();
  }, [formData.farmId]);

  // ✅ Handle source type change
  const handleSourceTypeChange = useCallback((sourceType) => {
    setFormData((prev) => ({
      ...prev,
      sourceType,
      motherId: sourceType === GOAT_SOURCE_TYPES.PURCHASED ? "" : prev.motherId,
      fatherId: sourceType === GOAT_SOURCE_TYPES.PURCHASED ? "" : prev.fatherId,
      purchaseContact:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED ? "" : prev.purchaseContact,
      purchaseDate:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED ? "" : prev.purchaseDate,
      sellerName:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED ? "" : prev.sellerName,
      purchasePrice:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED ? "" : prev.purchasePrice,
      purchaseType:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED
          ? PURCHASE_TYPES.LOCAL
          : prev.purchaseType,
      purchaseNote:
        sourceType === GOAT_SOURCE_TYPES.HOMEBRED ? "" : prev.purchaseNote,
    }));
  }, []);

  // ✅ Handle input change
  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const finalValue = type === "checkbox" ? checked : value;

      if (name === "sourceType") {
        handleSourceTypeChange(value);
      } else if (name === "gender") {
        setFormData((prev) => ({
          ...prev,
          gender: value,
          motherId: "",
          fatherId: "",
          isPregnant: value === "F" ? prev.isPregnant : false,
        }));
      } else if (name === "dob") {
        setFormData((prev) => ({
          ...prev,
          dob: value,
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
      }

      if (name === "tagId") {
        setTagIdError("");
      }
    },
    [handleSourceTypeChange],
  );

  // ✅ Check tag ID uniqueness
  const checkTagIdUnique = useCallback(
    async (tagId) => {
      if (!tagId) return true;
      try {
        const existing = await goatService.getByFarmIdAndTagId(
          formData.farmId,
          tagId,
        );
        if (initialData && initialData.tagId === tagId) {
          return true;
        }
        return !existing || existing.length === 0;
      } catch (error) {
        console.error("Error checking tag ID uniqueness:", error);
        return false;
      }
    },
    [formData.farmId, initialData],
  );

  // ✅ Reset form
  const resetForm = useCallback(() => {
    isInitializingRef.current = true;
    setFormData({
      farmId: initialFarmId,
      tagId: "",
      breed: "",
      dob: "",
      age: 0,
      weight: "",
      status: GOAT_STATUS.HEALTHY,
      stage: GOAT_STAGE.KID,
      sourceType: GOAT_SOURCE_TYPES.HOMEBRED,
      isPregnant: false,
      motherId: "",
      fatherId: "",
      purchaseContact: "",
      purchaseDate: "",
      sellerName: "",
      purchasePrice: "",
      purchaseType: PURCHASE_TYPES.LOCAL,
      purchaseNote: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      gender: "F",
    });
    setTagIdError("");
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
  }, [initialFarmId]);

  return {
    formData,
    setFormData,
    handleInputChange,
    parentOptions,
    loadingParents,
    resetForm,
    tagIdError,
    setTagIdError,
    checkTagIdUnique,
  };
};
