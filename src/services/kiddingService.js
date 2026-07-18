// src/services/kiddingService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "../firebase/firestore";

export const kiddingService = {
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.KIDDING, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },
  getByGoatId: async (farmId, goatId) => {
    return await getCollection(COLLECTIONS.KIDDING, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "goatId", operator: "==", value: goatId },
    ]);
  },
  add: async (data) => {
    return await addDocument(COLLECTIONS.KIDDING, data);
  },
  update: async (id, data) => {
    await updateDocument(COLLECTIONS.KIDDING, id, data);
  },
  delete: async (id) => {
    await deleteDocument(COLLECTIONS.KIDDING, id);
  },
};
