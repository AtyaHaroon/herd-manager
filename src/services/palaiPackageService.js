// src/services/palaiPackageService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from "../firebase/firestore";

export const palaiPackageService = {
  getByFarmId: async (farmId) => {
    return await getCollection("palaiPackages", [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  add: async (data) => {
    return await addDocument("palaiPackages", data);
  },

  update: async (id, data) => {
    await updateDocument("palaiPackages", id, data);
  },

  delete: async (id) => {
    await deleteDocument("palaiPackages", id);
  },
};
