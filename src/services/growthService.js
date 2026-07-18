// src/services/growthService.js - FIXED (removed unused imports)

import {
  getCollection,
  addDocument,
  updateDocument,
  COLLECTIONS,
} from "../firebase/firestore";
import { goatService } from "./goatService";

export const growthService = {
  // Get weight history for a goat
  getWeightHistory: async (goatId) => {
    return await getCollection(COLLECTIONS.WEIGHT_HISTORY, [
      { field: "goatId", operator: "==", value: goatId },
    ]);
  },

  // Add weight record
  addWeightRecord: async (data) => {
    const record = {
      ...data,
      createdAt: new Date(),
    };
    const id = await addDocument(COLLECTIONS.WEIGHT_HISTORY, record);

    // Update goat's current weight
    await goatService.update(data.goatId, {
      weight: data.weight,
      updatedAt: new Date(),
    });

    // Calculate growth metrics
    await growthService.calculateGrowthMetrics(data.goatId);

    return id;
  },

  // Calculate growth metrics (ADG, FCR, etc.)
  calculateGrowthMetrics: async (goatId) => {
    const history = await growthService.getWeightHistory(goatId);
    if (history.length < 2) return null;

    // Sort by date
    const sorted = history.sort((a, b) => new Date(a.date) - new Date(b.date));

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const daysDiff = Math.floor(
      (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === 0) return null;

    const weightGain = last.weight - first.weight;
    const adg = weightGain / daysDiff; // Average Daily Gain

    // Get feed consumption for this goat
    const feedConsumption = await growthService.getFeedConsumption(
      goatId,
      first.date,
      last.date,
    );

    let fcr = null;
    if (feedConsumption > 0 && weightGain > 0) {
      fcr = feedConsumption / weightGain; // Feed Conversion Ratio
    }

    // Predict target weight
    const targetWeight = 50; // Default target
    const remainingGain = targetWeight - last.weight;
    const daysToTarget =
      remainingGain > 0 && adg > 0 ? Math.ceil(remainingGain / adg) : null;

    const metrics = {
      goatId: goatId,
      initialWeight: first.weight,
      currentWeight: last.weight,
      weightGain: weightGain,
      daysTracked: daysDiff,
      adg: adg,
      fcr: fcr,
      feedConsumption: feedConsumption,
      targetWeight: targetWeight,
      daysToTarget: daysToTarget,
      lastUpdated: new Date(),
    };

    // Save growth metrics
    const existing = await getCollection(COLLECTIONS.GROWTH_RECORDS, [
      { field: "goatId", operator: "==", value: goatId },
    ]);

    if (existing && existing.length > 0) {
      await updateDocument(COLLECTIONS.GROWTH_RECORDS, existing[0].id, metrics);
      return { ...metrics, id: existing[0].id };
    } else {
      const id = await addDocument(COLLECTIONS.GROWTH_RECORDS, metrics);
      return { ...metrics, id };
    }
  },

  // Get feed consumption for a goat in a date range
  getFeedConsumption: async (goatId, startDate, endDate) => {
    const assignments = await getCollection(COLLECTIONS.FEED_ASSIGNMENTS, [
      { field: "goatId", operator: "==", value: goatId },
    ]);

    let totalFeed = 0;
    for (const assignment of assignments) {
      const assignDate = new Date(assignment.startDate);
      if (
        assignDate >= new Date(startDate) &&
        assignDate <= new Date(endDate)
      ) {
        totalFeed += assignment.totalFeed || 0;
      }
    }

    return totalFeed;
  },

  // Get growth prediction
  getGrowthPrediction: async (goatId, targetWeight) => {
    const metrics = await growthService.getGrowthMetrics(goatId);
    if (!metrics || !metrics.adg || metrics.adg <= 0) {
      return {
        targetWeight: targetWeight || 50,
        currentWeight: metrics?.currentWeight || 0,
        daysToTarget: null,
        message: "Insufficient data for prediction",
      };
    }

    const currentWeight = metrics.currentWeight || 0;
    const target = targetWeight || 50;
    const remainingGain = target - currentWeight;
    const daysToTarget =
      remainingGain > 0 ? Math.ceil(remainingGain / metrics.adg) : 0;

    return {
      targetWeight: target,
      currentWeight: currentWeight,
      daysToTarget: daysToTarget,
      adg: metrics.adg,
      message:
        daysToTarget > 0
          ? `At current growth rate (${metrics.adg.toFixed(
              3,
            )} kg/day), will reach ${target} kg in ${daysToTarget} days`
          : "Already at or above target weight",
    };
  },

  // Get growth metrics for a goat
  getGrowthMetrics: async (goatId) => {
    const records = await getCollection(COLLECTIONS.GROWTH_RECORDS, [
      { field: "goatId", operator: "==", value: goatId },
    ]);
    return records && records.length > 0 ? records[0] : null;
  },
};
