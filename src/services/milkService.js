// src/services/milkService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "../firebase/firestore";

export const milkService = {
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.MILK, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },
  getByGoatId: async (farmId, goatId) => {
    return await getCollection(COLLECTIONS.MILK, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "goatId", operator: "==", value: goatId },
    ]);
  },
  add: async (data) => {
    return await addDocument(COLLECTIONS.MILK, data);
  },
  update: async (id, data) => {
    await updateDocument(COLLECTIONS.MILK, id, data);
  },
  delete: async (id) => {
    await deleteDocument(COLLECTIONS.MILK, id);
  },
};
