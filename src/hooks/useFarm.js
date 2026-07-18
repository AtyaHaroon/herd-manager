// src/hooks/useFarm.js - FIXED

import { useState, useEffect, useRef } from "react";
import { getCollection, COLLECTIONS, getDocument } from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";

export const useFarm = () => {
  const { currentUser } = useAuth();
  const [farmName, setFarmName] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const userIdRef = useRef(currentUser?.uid);
  const farmIdRef = useRef(currentUser?.farmId);

  useEffect(() => {
    isMountedRef.current = true;

    // ✅ FIX: Only fetch if userId or farmId actually changed
    const currentUserId = currentUser?.uid;
    const currentFarmId = currentUser?.farmId;

    if (
      currentUserId !== userIdRef.current ||
      currentFarmId !== farmIdRef.current
    ) {
      userIdRef.current = currentUserId;
      farmIdRef.current = currentFarmId;

      const fetchFarmName = async () => {
        if (currentUserId) {
          try {
            let farmId = currentFarmId;

            // If farmId is not directly available, get it from user document
            if (!farmId) {
              console.log(
                "No farmId in currentUser, fetching from document...",
              );
              const userDoc = await getDocument(
                COLLECTIONS.USERS,
                currentUserId,
              );
              if (userDoc) {
                farmId = userDoc.farmId;
                farmIdRef.current = farmId;
                console.log("Found farmId in user document:", farmId);
              }
            }

            if (farmId) {
              // Get farm by document ID
              const farmDoc = await getDocument(COLLECTIONS.FARMS, farmId);
              if (farmDoc && isMountedRef.current) {
                setFarmName(farmDoc.name);
                console.log("Farm name found:", farmDoc.name);
              } else if (isMountedRef.current) {
                // Fallback: Search by ownerId
                const farmsData = await getCollection(COLLECTIONS.FARMS, [
                  { field: "ownerId", operator: "==", value: currentUserId },
                ]);

                if (farmsData && farmsData.length > 0 && isMountedRef.current) {
                  setFarmName(farmsData[0].name);
                } else if (isMountedRef.current) {
                  setFarmName("My Farm");
                }
              }
            } else if (isMountedRef.current) {
              // Fallback: Search by ownerId
              const farmsData = await getCollection(COLLECTIONS.FARMS, [
                { field: "ownerId", operator: "==", value: currentUserId },
              ]);

              if (farmsData && farmsData.length > 0 && isMountedRef.current) {
                setFarmName(farmsData[0].name);
              } else {
                setFarmName("My Farm");
              }
            }
          } catch (error) {
            console.error("Error fetching farm name:", error);
            if (isMountedRef.current) {
              setFarmName("My Farm");
            }
          } finally {
            if (isMountedRef.current) {
              setLoading(false);
            }
          }
        }
      };

      fetchFarmName();
    } else {
      // ✅ If no change, just set loading to false
      if (isMountedRef.current) {
        setLoading(false);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser]); // ✅ Only re-run when currentUser changes

  return { farmName, loading };
};
