// src/services/feedAssignmentService.js - FIXED (removed unused getDocument import)

import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "../firebase/firestore";
import { feedInventoryService } from "./feedInventoryService";
import { feedMixService } from "./feedMixService";

export const feedAssignmentService = {
  // Get all feed assignments for a farm
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.FEED_ASSIGNMENTS, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  // Get active assignments
  getActive: async (farmId) => {
    return await getCollection(COLLECTIONS.FEED_ASSIGNMENTS, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "status", operator: "==", value: "Active" },
    ]);
  },

  // Get assignments for a specific goat
  getByGoatId: async (farmId, goatId) => {
    return await getCollection(COLLECTIONS.FEED_ASSIGNMENTS, [
      { field: "farmId", operator: "==", value: farmId },
      { field: "goatId", operator: "==", value: goatId },
    ]);
  },

  // Create a new feed assignment
  add: async (data) => {
    // Calculate total feed needed
    const totalFeed = data.quantity * data.numberOfGoats;

    // Check if enough stock is available
    if (data.feedMixId) {
      // If using a feed mix, check each ingredient
      const mix = await feedMixService.getById(data.feedMixId);
      if (mix && mix.ingredients) {
        for (const ingredient of mix.ingredients) {
          const feed = await feedInventoryService.getById(ingredient.feedId);
          if (feed) {
            const needed = (totalFeed * ingredient.percentage) / 100;
            if ((feed.stockQuantity || 0) < needed) {
              throw new Error(
                `Insufficient stock for ${feed.name}. Need ${needed.toFixed(
                  2,
                )} ${feed.unit || "kg"}, available ${feed.stockQuantity || 0}`,
              );
            }
          }
        }
      }
    } else if (data.feedId) {
      // Single feed
      const feed = await feedInventoryService.getById(data.feedId);
      if (feed && (feed.stockQuantity || 0) < totalFeed) {
        throw new Error(
          `Insufficient stock for ${feed.name}. Need ${totalFeed.toFixed(2)} ${
            feed.unit || "kg"
          }, available ${feed.stockQuantity || 0}`,
        );
      }
    }

    const assignmentData = {
      ...data,
      totalFeed: totalFeed,
      status: "Active",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await addDocument(COLLECTIONS.FEED_ASSIGNMENTS, assignmentData);

    // Reduce inventory
    await feedAssignmentService.deductInventory(data, totalFeed);

    return id;
  },

  // Deduct feed from inventory
  deductInventory: async (assignment, totalFeed) => {
    if (assignment.feedMixId) {
      const mix = await feedMixService.getById(assignment.feedMixId);
      if (mix && mix.ingredients) {
        for (const ingredient of mix.ingredients) {
          const needed = (totalFeed * ingredient.percentage) / 100;
          await feedInventoryService.reduceStock(ingredient.feedId, needed);
        }
      }
    } else if (assignment.feedId) {
      await feedInventoryService.reduceStock(assignment.feedId, totalFeed);
    }
  },

  // Update assignment status
  updateStatus: async (id, status) => {
    await updateDocument(COLLECTIONS.FEED_ASSIGNMENTS, id, {
      status: status,
      updatedAt: new Date(),
    });
  },

  // Complete assignment
  complete: async (id) => {
    await feedAssignmentService.updateStatus(id, "Completed");
  },

  // Delete assignment
  delete: async (id) => {
    await deleteDocument(COLLECTIONS.FEED_ASSIGNMENTS, id);
  },

  // Get consumption logs
  getConsumptionLogs: async (farmId) => {
    return await getCollection(COLLECTIONS.FEED_CONSUMPTION, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  // Log daily consumption
  logConsumption: async (data) => {
    const logData = {
      ...data,
      createdAt: new Date(),
    };
    return await addDocument(COLLECTIONS.FEED_CONSUMPTION, logData);
  },
};
