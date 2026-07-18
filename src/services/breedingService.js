// src/services/breedingService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
  getDocument,
} from "../firebase/firestore";

export const breedingService = {
  // Get all breeding records for a farm
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.BREEDING, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  // Get breeding record by ID
  getById: async (id) => {
    return await getDocument(COLLECTIONS.BREEDING, id);
  },

  // Add new breeding record
  add: async (data) => {
    return await addDocument(COLLECTIONS.BREEDING, data);
  },

  // Update breeding record
  update: async (id, data) => {
    await updateDocument(COLLECTIONS.BREEDING, id, data);
  },

  // Delete breeding record
  delete: async (id) => {
    await deleteDocument(COLLECTIONS.BREEDING, id);
  },

  // Get breeding records by goat ID
  getByGoatId: async (farmId, goatId) => {
    return await getCollection(COLLECTIONS.BREEDING, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "goatId", operator: "==", value: goatId },
    ]);
  },

  // Get breeding records by status
  getByStatus: async (farmId, status) => {
    return await getCollection(COLLECTIONS.BREEDING, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "status", operator: "==", value: status },
    ]);
  },
};
