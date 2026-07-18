// services/feedMixService.js
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
  getDocument,
} from "../firebase/firestore";
import { feedInventoryService } from "./feedInventoryService";

export const feedMixService = {
  // Get all feed mixes for a farm
  getByFarmId: async (farmId) => {
    return await getCollection(COLLECTIONS.FEED_MIXES, [
      { field: "farmId", operator: "==", value: farmId },
    ]);
  },

  // Get feed mix by ID
  getById: async (id) => {
    return await getDocument(COLLECTIONS.FEED_MIXES, id);
  },

  // Add new feed mix
  add: async (data) => {
    // Calculate nutrient composition
    const composition = await feedMixService.calculateComposition(
      data.ingredients,
    );
    const finalData = {
      ...data,
      ...composition,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await addDocument(COLLECTIONS.FEED_MIXES, finalData);
  },

  // Update feed mix
  update: async (id, data) => {
    // Recalculate if ingredients changed
    let updateData = { ...data, updatedAt: new Date() };
    if (data.ingredients) {
      const composition = await feedMixService.calculateComposition(
        data.ingredients,
      );
      updateData = { ...updateData, ...composition };
    }
    await updateDocument(COLLECTIONS.FEED_MIXES, id, updateData);
  },

  // Delete feed mix
  delete: async (id) => {
    await deleteDocument(COLLECTIONS.FEED_MIXES, id);
  },

  // Calculate nutrient composition of a feed mix
  calculateComposition: async (ingredients) => {
    if (!ingredients || ingredients.length === 0) {
      return {
        protein: 0,
        energy: 0,
        fiber: 0,
        fat: 0,
        calcium: 0,
        phosphorus: 0,
        costPerKg: 0,
      };
    }

    let totalProtein = 0;
    let totalEnergy = 0;
    let totalFiber = 0;
    let totalFat = 0;
    let totalCalcium = 0;
    let totalPhosphorus = 0;
    let totalCost = 0;
    let totalPercentage = 0;

    // Fetch all feed items to get their nutrient values
    const feedIds = ingredients.map((i) => i.feedId);
    const feedPromises = feedIds.map((id) => feedInventoryService.getById(id));
    const feedItems = await Promise.all(feedPromises);

    for (const ingredient of ingredients) {
      const feed = feedItems.find((f) => f && f.id === ingredient.feedId);
      if (!feed) continue;

      const percentage = ingredient.percentage || 0;
      totalPercentage += percentage;

      totalProtein += (feed.protein || 0) * (percentage / 100);
      totalEnergy += (feed.energy || 0) * (percentage / 100);
      totalFiber += (feed.fiber || 0) * (percentage / 100);
      totalFat += (feed.fat || 0) * (percentage / 100);
      totalCalcium += (feed.calcium || 0) * (percentage / 100);
      totalPhosphorus += (feed.phosphorus || 0) * (percentage / 100);
      totalCost += (feed.costPerUnit || 0) * (percentage / 100);
    }

    // Normalize if percentages don't sum to 100
    if (totalPercentage > 0 && totalPercentage !== 100) {
      const factor = 100 / totalPercentage;
      return {
        protein: totalProtein * factor,
        energy: totalEnergy * factor,
        fiber: totalFiber * factor,
        fat: totalFat * factor,
        calcium: totalCalcium * factor,
        phosphorus: totalPhosphorus * factor,
        costPerKg: totalCost * factor,
      };
    }

    return {
      protein: totalProtein,
      energy: totalEnergy,
      fiber: totalFiber,
      fat: totalFat,
      calcium: totalCalcium,
      phosphorus: totalPhosphorus,
      costPerKg: totalCost,
    };
  },

  // Calculate daily feed requirement for a goat
  calculateDailyRequirement: (weight, percentage = 3) => {
    return (weight * percentage) / 100;
  },

  // Calculate feed required for multiple goats
  calculateTotalRequirement: (goats, percentage = 3) => {
    let total = 0;
    for (const goat of goats) {
      const weight = goat.weight || 0;
      total += (weight * percentage) / 100;
    }
    return total;
  },
};
