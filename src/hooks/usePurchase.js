// src/hooks/usePurchase.js
import { useFirestore } from "./useFirestore";
import { COLLECTIONS } from "../firebase/firestore";

export const usePurchase = () => {
  const { add } = useFirestore(COLLECTIONS.PURCHASES);

  const addPurchase = async (purchaseData) => {
    return await add(purchaseData);
  };

  return { addPurchase };
};
