// src/services/feedInventoryService.js - COMPLETE REWRITE

import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
  getDocument,
} from "../firebase/firestore";

export const feedInventoryService = {
  // Get all feed items for a farm
  getByFarmId: async (farmId) => {
    if (!farmId) return [];
    try {
      const result = await getCollection(COLLECTIONS.FEED, [
        { field: "farmId", operator: "==", value: farmId },
      ]);
      return result;
    } catch (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }
  },

  getById: async (id) => {
    return await getDocument(COLLECTIONS.FEED, id);
  },

  // Add new feed item
  add: async (data) => {
    const costPerKg =
      data.totalCost && data.quantity > 0
        ? data.totalCost / data.quantity
        : data.costPerKg || 0;

    const feedData = {
      ...data,
      costPerKg: costPerKg,
      remainingStock: data.quantity || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await addDocument(COLLECTIONS.FEED, feedData);
  },

  update: async (id, data) => {
    const updateData = { ...data, updatedAt: new Date() };
    if (data.quantity && data.totalCost) {
      updateData.costPerKg = data.totalCost / data.quantity;
    }
    await updateDocument(COLLECTIONS.FEED, id, updateData);
  },

  delete: async (id) => {
    await deleteDocument(COLLECTIONS.FEED, id);
  },

  // Deduct stock from inventory
  deductStock: async (id, quantity) => {
    const feed = await feedInventoryService.getById(id);
    if (!feed) throw new Error("Feed not found");

    const newStock = Math.max(0, (feed.remainingStock || 0) - quantity);

    if (newStock < 0) {
      throw new Error(
        `Insufficient stock. Available: ${feed.remainingStock} ${feed.unit}`,
      );
    }

    await updateDocument(COLLECTIONS.FEED, id, {
      remainingStock: newStock,
      updatedAt: new Date(),
    });

    // Log deduction
    await feedInventoryService.logDeduction(id, quantity, feed);
    return newStock;
  },

  logDeduction: async (feedId, quantity, feed) => {
    const logData = {
      feedId: feedId,
      feedName: feed.name,
      quantity: quantity,
      previousStock: feed.remainingStock,
      newStock: feed.remainingStock - quantity,
      farmId: feed.farmId,
      timestamp: new Date(),
      type: "deduction",
    };
    await addDocument(COLLECTIONS.FEED_DEDUCTION_LOGS, logData);
  },

  // Restock feed
  restock: async (id, quantity, totalCost) => {
    const feed = await feedInventoryService.getById(id);
    if (!feed) throw new Error("Feed not found");

    const newStock = (feed.remainingStock || 0) + quantity;
    const newTotalCost = (feed.totalCost || 0) + totalCost;

    await updateDocument(COLLECTIONS.FEED, id, {
      remainingStock: newStock,
      quantity: newStock,
      totalCost: newTotalCost,
      costPerKg: newStock > 0 ? newTotalCost / newStock : 0,
      lastRestocked: new Date(),
      updatedAt: new Date(),
    });

    return newStock;
  },

  getLowStockItems: async (farmId) => {
    const items = await feedInventoryService.getByFarmId(farmId);
    return items.filter((item) => {
      const threshold = item.minStockAlert || 10;
      return (item.remainingStock || 0) <= threshold;
    });
  },

  getTotalValue: async (farmId) => {
    const items = await feedInventoryService.getByFarmId(farmId);
    return items.reduce((total, item) => {
      return total + (item.remainingStock || 0) * (item.costPerKg || 0);
    }, 0);
  },

  getUsageHistory: async (farmId, days = 7) => {
    const logs = await getCollection(COLLECTIONS.FEED_DEDUCTION_LOGS, [
      { field: "farmId", operator: "==", value: farmId },
    ]);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return logs.filter((log) => {
      const logDate = log.timestamp?.toDate?.() || new Date(log.timestamp);
      return logDate >= cutoff;
    });
  },
};
