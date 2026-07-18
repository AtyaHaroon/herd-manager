// src/firebase/firestore.js - FIXED VERSION

import { useState, useCallback } from "react";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const COLLECTIONS = {
  USERS: "users",
  FARMS: "farms",
  GOATS: "goats",
  PURCHASES: "purchases",
  BREEDING: "breeding",
  PREGNANCIES: "pregnancies",
  KIDDING: "kidding",
  MILK: "milk",
  FEED: "feed",
  FEED_PURCHASES: "feedPurchases", // Feed purchase history
  FEED_MIXES: "feedMixes", // Feed formulations/mixes
  FEED_ASSIGNMENTS: "feedAssignments", // Feed assigned to goats
  FEED_CONSUMPTION: "feedConsumption", // Daily feed consumption logs
  WEIGHT_HISTORY: "weightHistory", // Goat weight tracking history
  GROWTH_RECORDS: "growthRecords", // Growth calculations (ADG, FCR)
  FEED_INVENTORY: "feedInventory",
  INCOMES: "incomes",
  EXPENSES: "expenses",
  EVENTS: "events",
  GOAT_VACCINES: "goatVaccines",
  MEDICATIONS: "medications",
  ROLE_CONFIGS: "roleConfigs",
  MEDICINES: "medicines",
  VACCINES: "vaccines",
};

export const checkFieldUniqueness = async (collectionName, field, value) => {
  try {
    const q = query(collection(db, collectionName), where(field, "==", value));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking uniqueness:", error);
    if (error.code === "permission-denied") {
      console.warn(
        "Permission denied for uniqueness check, assuming not exists",
      );
      return false;
    }
    throw error;
  }
};

export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(
    async (filters = [], userId = null) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCollection(collectionName, filters, userId);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const fetchOne = useCallback(
    async (id) => {
      setLoading(true);
      try {
        return await getDocument(collectionName, id);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName],
  );

  const add = useCallback(
    async (data) => {
      setLoading(true);
      try {
        const id = await addDocument(collectionName, data);
        await fetchAll();
        return id;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, fetchAll],
  );

  const update = useCallback(
    async (id, data) => {
      setLoading(true);
      try {
        await updateDocument(collectionName, id, data);
        await fetchAll();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, fetchAll],
  );

  const remove = useCallback(
    async (id) => {
      setLoading(true);
      try {
        await deleteDocument(collectionName, id);
        await fetchAll();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collectionName, fetchAll],
  );

  return { data, loading, error, fetchAll, fetchOne, add, update, remove };
};

export const getCollection = async (collectionName, filters = []) => {
  try {
    let q = collection(db, collectionName);

    if (filters.length > 0) {
      const constraints = filters.map((f) =>
        where(f.field, f.operator, f.value),
      );
      q = query(q, ...constraints);
    }

    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

// ✅ FIXED: Always use auto-generated ID for goats (and most collections)
export const addDocument = async (collectionName, data) => {
  try {
    console.log("Adding document to:", collectionName, "with data:", data);

    const finalData = {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // ✅ ONLY use userId as document ID for USERS collection
    // For all other collections, use auto-generated ID
    if (collectionName === COLLECTIONS.USERS && data.userId) {
      console.log("Using userId as document ID for USERS:", data.userId);
      const docRef = doc(db, collectionName, data.userId);
      await setDoc(docRef, finalData);
      console.log("User document created with ID:", data.userId);
      return data.userId;
    }

    // ✅ For FARMS collection, use farmId as document ID
    if (collectionName === COLLECTIONS.FARMS && data.farmId) {
      console.log("Using farmId as document ID for FARMS:", data.farmId);
      const docRef = doc(db, collectionName, data.farmId);
      await setDoc(docRef, finalData);
      console.log("Farm document created with ID:", data.farmId);
      return data.farmId;
    }

    // ✅ For ALL OTHER collections (GOATS, MILK, etc.) use auto-generated ID
    console.log("Using auto-generated document ID for:", collectionName);
    const docRef = await addDoc(collection(db, collectionName), finalData);
    console.log("Document created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    console.log("Updating document:", collectionName, docId, data);
    const docRef = doc(db, collectionName, docId);
    const finalData = {
      ...data,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, finalData);
    console.log("Document updated successfully");
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

export const setDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const finalData = {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(docRef, finalData);
    return docId;
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
};

if (process.env.NODE_ENV === "development") {
  console.log("Firebase Config:", {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN
      ? "✓ Set"
      : "✗ Missing",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
      ? "✓ Set"
      : "✗ Missing",
  });
}
