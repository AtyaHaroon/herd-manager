// src/services/goatService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
  getDocument,
} from "../firebase/firestore";

export const goatService = {
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.GOATS, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  getByFarmIdAndTagId: async (farmId, tagId) => {
    return await getCollection(COLLECTIONS.GOATS, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "tagId", operator: "==", value: tagId },
    ]);
  },

  add: async (data) => {
    return await addDocument(COLLECTIONS.GOATS, data);
  },

  update: async (id, data) => {
    await updateDocument(COLLECTIONS.GOATS, id, data);
  },

  delete: async (id) => {
    await deleteDocument(COLLECTIONS.GOATS, id);
  },

  getParentsForDropdown: async (farmId, gender) => {
    const goats = await getCollection(COLLECTIONS.GOATS, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "gender", operator: "==", value: gender },
      { field: "isActive", operator: "==", value: true },
    ]);
    return goats || [];
  },

  getById: async (id) => {
    return await getDocument(COLLECTIONS.GOATS, id);
  },

  //  NEW: Get only lactating goats for milking
  getLactatingByFarmId: async (farmId) => {
    const goats = await getCollection(COLLECTIONS.GOATS, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "status", operator: "==", value: "Lactating" },
      { field: "isActive", operator: "==", value: true },
    ]);
    return goats || [];
  },

  //  NEW: Update goat status
  updateGoatStatus: async (goatId, status) => {
    await updateDocument(COLLECTIONS.GOATS, goatId, {
      status: status,
      updatedAt: new Date(),
    });
  },
};
