// src/pages/Inventory.jsx
// ISMEI Inventory page with top tabs, no icons, improved UI

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { feedInventoryService } from "../../services/feedInventoryService";
import { feedMixService } from "../../services/feedMixService";
import { goatService } from "../../services/goatService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import ConfirmModal from "../../components/Common/ConfirmModal";
import { formatCurrencyFull } from "../../utils/helpers";
import { FEED_CATEGORIES, FEED_UNITS } from "../../utils/constants";

// ============================================
// FEED CALCULATOR TAB COMPONENT
// ============================================
const FeedCalculatorTab = ({ farmId, feedMixes, feedItems }) => {
  const [selectedMixId, setSelectedMixId] = useState("");
  const [goats, setGoats] = useState([]);
  const [feedPlan, setFeedPlan] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loadingGoats, setLoadingGoats] = useState(false);

  // Load goats
  useEffect(() => {
    const loadGoats = async () => {
      if (!farmId) return;
      setLoadingGoats(true);
      try {
        const goatsData = await goatService.getByFarmId(farmId);
        setGoats(goatsData || []);
      } catch (error) {
        console.error("Error loading goats:", error);
        setToastMessage("Failed to load goat data.");
      } finally {
        setLoadingGoats(false);
      }
    };
    loadGoats();
  }, [farmId]);

  // Set default feed mix
  useEffect(() => {
    if (feedMixes && feedMixes.length > 0 && !selectedMixId) {
      setSelectedMixId(feedMixes[0].id);
    }
  }, [feedMixes, selectedMixId]);

  const getGoatStats = () => {
    const activeGoats = goats.filter((g) => g.isActive !== false);
    const withWeight = activeGoats.filter((g) => g.weight && g.weight > 0);
    const totalWeight = withWeight.reduce((sum, g) => sum + g.weight, 0);

    return {
      total: activeGoats.length,
      withWeight: withWeight.length,
      totalWeight: totalWeight,
      avgWeight: withWeight.length > 0 ? totalWeight / withWeight.length : 0,
    };
  };

  const calculateFeedPlan = async () => {
    if (!selectedMixId) {
      setToastMessage("Please select a feed mix");
      return;
    }

    const activeGoats = goats.filter((g) => g.isActive !== false);
    const withWeight = activeGoats.filter((g) => g.weight && g.weight > 0);

    if (withWeight.length === 0) {
      setToastMessage("No goats with weight records found.");
      return;
    }

    setCalculating(true);
    try {
      const feedMix = feedMixes.find((m) => m.id === selectedMixId);
      if (!feedMix) {
        throw new Error("Feed mix not found");
      }

      const FEED_PERCENTAGE = 3.5;

      const totalWeight = withWeight.reduce((sum, g) => sum + g.weight, 0);
      const totalFeedRequired = (totalWeight * FEED_PERCENTAGE) / 100;

      const perGoatBreakdown = withWeight.map((goat) => {
        const feedPerGoat = (goat.weight * FEED_PERCENTAGE) / 100;
        return {
          goatId: goat.id,
          tagId: goat.tagId,
          weight: goat.weight,
          feedRequired: feedPerGoat,
          feedPercentage: FEED_PERCENTAGE,
        };
      });

      const ingredientRequirements = feedMix.ingredients.map((ing) => {
        const quantity = (totalFeedRequired * ing.percentage) / 100;
        const feedItem = feedItems.find((f) => f.id === ing.feedId);
        return {
          feedId: ing.feedId,
          feedName: ing.feedName || feedItem?.name || "Unknown",
          percentage: ing.percentage,
          dailyQuantity: quantity,
          monthlyQuantity: quantity * 30,
          costPerUnit: feedItem?.costPerUnit || 0,
          dailyCost: quantity * (feedItem?.costPerUnit || 0),
          monthlyCost: quantity * 30 * (feedItem?.costPerUnit || 0),
          currentStock: feedItem?.stockQuantity || 0,
          unit: feedItem?.unit || "kg",
        };
      });

      const inventoryStatus = ingredientRequirements.map((ing) => {
        const daysAvailable =
          ing.dailyQuantity > 0
            ? Math.floor(ing.currentStock / ing.dailyQuantity)
            : 0;
        return {
          ...ing,
          daysAvailable: daysAvailable,
          isLowStock: daysAvailable < 7,
          needsRestock: daysAvailable < 3,
        };
      });

      const totalDailyCost = inventoryStatus.reduce(
        (sum, ing) => sum + ing.dailyCost,
        0,
      );
      const totalMonthlyCost = inventoryStatus.reduce(
        (sum, ing) => sum + ing.monthlyCost,
        0,
      );

      setFeedPlan({
        feedMixName: feedMix.name,
        feedMixId: feedMix.id,
        feedPercentage: FEED_PERCENTAGE,
        totalGoats: withWeight.length,
        totalWeight: totalWeight,
        averageWeight: totalWeight / withWeight.length,
        totalFeedRequired: totalFeedRequired,
        monthlyRequirement: totalFeedRequired * 30,
        perGoatBreakdown: perGoatBreakdown,
        inventoryStatus: inventoryStatus,
        totalDailyCost: totalDailyCost,
        totalMonthlyCost: totalMonthlyCost,
        summary: {
          totalDaysAvailable: Math.min(
            ...inventoryStatus.map((i) => i.daysAvailable),
          ),
          itemsLowStock: inventoryStatus.filter((i) => i.isLowStock).length,
          itemsNeedingRestock: inventoryStatus.filter((i) => i.needsRestock)
            .length,
        },
      });
    } catch (error) {
      console.error("Error calculating feed plan:", error);
      setToastMessage("Failed to calculate feed plan: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const goatStats = getGoatStats();

  return (
    <div style={{ marginTop: "16px" }}>
      {/* Goat Stats */}
      <div className="overview-grid" style={{ marginBottom: "16px" }}>
        <div className="ov-card">
          <span className="ov-num">{goatStats.total}</span>
          <span className="ov-lbl">Total Goats</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{goatStats.withWeight}</span>
          <span className="ov-lbl">With Weight</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">{goatStats.totalWeight.toFixed(1)} kg</span>
          <span className="ov-lbl">Total Weight</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.08)" }}
        >
          <span className="ov-num">{goatStats.avgWeight.toFixed(1)} kg</span>
          <span className="ov-lbl">Avg Weight</span>
        </div>
      </div>

      {/* Controls */}
      <div className="filter-bar" style={{ flexWrap: "wrap", gap: "12px" }}>
        <select
          value={selectedMixId}
          onChange={(e) => setSelectedMixId(e.target.value)}
          style={{ minWidth: "200px", padding: "8px 12px" }}
          disabled={calculating || loadingGoats}
        >
          {feedMixes.length === 0 ? (
            <option value="">No feed mixes available</option>
          ) : (
            feedMixes.map((mix) => (
              <option key={mix.id} value={mix.id}>
                {mix.name} ({mix.protein?.toFixed(1) || 0}% protein)
              </option>
            ))
          )}
        </select>
        <span style={{ fontSize: "0.7rem", color: "#766d5d" }}>
          Feed: 3.5% of body weight
        </span>
        <button
          className="btn btn-primary"
          onClick={calculateFeedPlan}
          disabled={calculating || !selectedMixId || feedMixes.length === 0}
        >
          {calculating ? "Calculating..." : "Calculate Feed Plan"}
        </button>
      </div>

      {/* Feed Plan Results */}
      {feedPlan && (
        <div className="feed-plan-results" style={{ marginTop: "20px" }}>
          <div
            style={{
              backgroundColor: "rgba(15, 122, 117, 0.08)",
              borderRadius: "12px",
              padding: "20px",
              border: "2px solid var(--pasture)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                textAlign: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Feed Percentage
                </span>
                <br />
                <strong style={{ fontSize: "1.8rem", color: "var(--pasture)" }}>
                  {feedPlan.feedPercentage}%
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  of body weight
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Daily Feed Required
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--pasture)" }}>
                  {feedPlan.totalFeedRequired.toFixed(2)} kg
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  {feedPlan.totalGoats} goats × {feedPlan.feedPercentage}%
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Monthly Requirement
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--gold)" }}>
                  {feedPlan.monthlyRequirement.toFixed(2)} kg
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Per month (30 days)
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Daily Cost
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--pasture)" }}>
                  PKR {feedPlan.totalDailyCost.toFixed(0)}
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Based on current prices
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Monthly Cost
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--gold)" }}>
                  PKR {feedPlan.totalMonthlyCost.toFixed(0)}
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Per month (30 days)
                </span>
              </div>
            </div>

            {feedPlan.perGoatBreakdown &&
              feedPlan.perGoatBreakdown.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(15, 122, 117, 0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#766d5d",
                    }}
                  >
                    Per Goat Feed Requirement ({feedPlan.feedPercentage}% of
                    body weight)
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 12px",
                      marginTop: "6px",
                      maxHeight: "120px",
                      overflowY: "auto",
                      padding: "4px 0",
                    }}
                  >
                    {feedPlan.perGoatBreakdown.slice(0, 15).map((g) => (
                      <span
                        key={g.goatId}
                        style={{
                          fontSize: "0.6rem",
                          background: "rgba(15, 122, 117, 0.06)",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <strong>{g.tagId}</strong>: {g.feedRequired.toFixed(2)}{" "}
                        kg
                        <span style={{ color: "#766d5d", fontSize: "0.5rem" }}>
                          {" "}
                          ({g.weight} kg × {g.feedPercentage}%)
                        </span>
                      </span>
                    ))}
                    {feedPlan.perGoatBreakdown.length > 15 && (
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "#766d5d",
                          padding: "2px 10px",
                        }}
                      >
                        +{feedPlan.perGoatBreakdown.length - 15} more goats
                      </span>
                    )}
                  </div>
                </div>
              )}

            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                borderRadius: "6px",
                fontSize: "0.6rem",
                color: "#555",
                textAlign: "center",
                border: "1px dashed rgba(15, 122, 117, 0.3)",
              }}
            >
              Formula: <strong>{feedPlan.feedPercentage}% × Body Weight</strong>{" "}
              = Daily Feed per Goat
              <br />
              Example: 40 kg goat × {feedPlan.feedPercentage}% ={" "}
              {((40 * feedPlan.feedPercentage) / 100).toFixed(2)} kg/day
            </div>
          </div>

          {/* Ingredient Requirements */}
          <div>
            <h3 style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
              Ingredient Requirements & Inventory Status
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>% in Mix</th>
                    <th>Daily Required</th>
                    <th>Monthly Required</th>
                    <th>Current Stock</th>
                    <th>Days Available</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feedPlan.inventoryStatus.map((ing) => (
                    <tr
                      key={ing.feedId}
                      style={{
                        backgroundColor: ing.needsRestock
                          ? "rgba(244, 67, 54, 0.08)"
                          : ing.isLowStock
                          ? "rgba(255, 152, 0, 0.08)"
                          : "transparent",
                      }}
                    >
                      <td>
                        <strong>{ing.feedName}</strong>
                      </td>
                      <td>{ing.percentage}%</td>
                      <td>
                        <strong>{ing.dailyQuantity.toFixed(2)} kg</strong>
                      </td>
                      <td>
                        <span style={{ color: "var(--gold)" }}>
                          {ing.monthlyQuantity.toFixed(2)} kg
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight:
                              ing.currentStock < ing.dailyQuantity ? 700 : 400,
                            color:
                              ing.currentStock < ing.dailyQuantity
                                ? "var(--danger)"
                                : "var(--pasture)",
                          }}
                        >
                          {ing.currentStock.toFixed(2)} {ing.unit}
                        </span>
                      </td>
                      <td>
                        {ing.daysAvailable > 0 ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                ing.daysAvailable < 3
                                  ? "var(--danger)"
                                  : ing.daysAvailable < 7
                                  ? "var(--gold)"
                                  : "var(--pasture)",
                            }}
                          >
                            {ing.daysAvailable} days
                          </span>
                        ) : (
                          <span style={{ color: "var(--danger)" }}>0</span>
                        )}
                      </td>
                      <td>
                        {ing.needsRestock ? (
                          <span className="pill overdue">Restock Now!</span>
                        ) : ing.isLowStock ? (
                          <span className="pill due">Low Stock</span>
                        ) : (
                          <span className="pill healthy">OK</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-small"
                          style={{ fontSize: "0.5rem", padding: "2px 8px" }}
                          onClick={() => {
                            const feedItem = feedItems.find(
                              (f) => f.id === ing.feedId,
                            );
                            if (feedItem) {
                              window.dispatchEvent(
                                new CustomEvent("openRestock", {
                                  detail: { feedItem },
                                }),
                              );
                            }
                          }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {feedPlan.summary && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  backgroundColor: "rgba(15, 122, 117, 0.04)",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color:
                      feedPlan.summary.itemsNeedingRestock > 0
                        ? "var(--danger)"
                        : "var(--pasture)",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {feedPlan.summary.itemsNeedingRestock} item(s) need restock
                  immediately
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color:
                      feedPlan.summary.itemsLowStock > 0
                        ? "var(--gold)"
                        : "var(--pasture)",
                  }}
                >
                  ⚠️ {feedPlan.summary.itemsLowStock} item(s) low stock
                </span>
                <span style={{ fontSize: "0.7rem", color: "#766d5d" }}>
                  Days available:{" "}
                  <strong>
                    {feedPlan.summary.totalDaysAvailable > 0
                      ? feedPlan.summary.totalDaysAvailable
                      : "0"}{" "}
                    days
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={calculateFeedPlan}
              disabled={calculating}
            >
              Recalculate
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                const printWindow = window.open("", "_blank");
                printWindow.document.write(`
                  <html><head><title>Feed Plan Report</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 10px 0; }
                    .summary-item { background: #f9f9f9; padding: 10px; border-radius: 4px; text-align: center; }
                    .formula { background: #e8f5e9; padding: 10px; border-radius: 4px; text-align: center; margin: 10px 0; }
                  </style>
                  </head><body>
                  <div class="header">
                    <h1>Feed Plan Report</h1>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Feed Mix: ${feedPlan.feedMixName} | ${
                  feedPlan.totalGoats
                } goats</p>
                    <div class="formula">
                      <strong>Feed: ${
                        feedPlan.feedPercentage
                      }% of body weight</strong>
                      <br>
                      Example: 40 kg goat × ${feedPlan.feedPercentage}% = ${(
                  (40 * feedPlan.feedPercentage) /
                  100
                ).toFixed(2)} kg/day
                    </div>
                  </div>
                  <div class="summary">
                    <div class="summary-item"><strong>Daily Feed</strong><br>${feedPlan.totalFeedRequired.toFixed(
                      2,
                    )} kg</div>
                    <div class="summary-item"><strong>Monthly Feed</strong><br>${feedPlan.monthlyRequirement.toFixed(
                      2,
                    )} kg</div>
                    <div class="summary-item"><strong>Daily Cost</strong><br>PKR ${feedPlan.totalDailyCost.toFixed(
                      0,
                    )}</div>
                    <div class="summary-item"><strong>Monthly Cost</strong><br>PKR ${feedPlan.totalMonthlyCost.toFixed(
                      0,
                    )}</div>
                  </div>
                  <h3>Per Goat Breakdown (${
                    feedPlan.feedPercentage
                  }% of body weight)</h3>
                  <table>
                    <thead><tr><th>Tag ID</th><th>Weight (kg)</th><th>Feed Required (kg/day)</th><th>Formula</th></tr></thead>
                    <tbody>
                      ${feedPlan.perGoatBreakdown
                        .map(
                          (g) => `
                        <tr>
                          <td>${g.tagId}</td>
                          <td>${g.weight}</td>
                          <td><strong>${g.feedRequired.toFixed(2)}</strong></td>
                          <td>${g.weight} × ${
                            g.feedPercentage
                          }% = ${g.feedRequired.toFixed(2)}</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                  <h3>Ingredient Requirements</h3>
                  <table>
                    <thead><tr><th>Ingredient</th><th>%</th><th>Daily (kg)</th><th>Monthly (kg)</th><th>Stock (kg)</th><th>Days</th><th>Status</th></tr></thead>
                    <tbody>
                      ${feedPlan.inventoryStatus
                        .map(
                          (ing) => `
                        <tr>
                          <td>${ing.feedName}</td>
                          <td>${ing.percentage}%</td>
                          <td>${ing.dailyQuantity.toFixed(2)}</td>
                          <td>${ing.monthlyQuantity.toFixed(2)}</td>
                          <td>${ing.currentStock.toFixed(2)}</td>
                          <td>${ing.daysAvailable}</td>
                          <td>${
                            ing.needsRestock
                              ? "RESTOCK NOW!"
                              : ing.isLowStock
                              ? "Low Stock"
                              : "OK"
                          }</td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                  <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">
                    * All calculations based on ${
                      feedPlan.feedPercentage
                    }% of body weight per goat
                  </p>
                  </body></html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                  printWindow.print();
                }, 500);
              }}
            >
              Print Report
            </button>
          </div>
        </div>
      )}

      {goatStats.withWeight === 0 && goatStats.total > 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px 16px",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 152, 0, 0.2)",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--gold)" }}>
            ⚠️ {goatStats.total} goats found but none have weight records. Add
            weights to goats for accurate feed calculations.
          </span>
        </div>
      )}

      {feedMixes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "#766d5d",
            backgroundColor: "rgba(15, 122, 117, 0.04)",
            borderRadius: "12px",
            border: "1px dashed var(--line)",
          }}
        >
          <p>No feed mixes available.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
            Go to <strong>Feed Mixes</strong> tab to create a feed mix first.
          </p>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

// ============================================
// MAIN INVENTORY COMPONENT
// ============================================

const Inventory = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [feedItems, setFeedItems] = useState([]);
  const [feedMixes, setFeedMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState(null);
  const [restockingFeed, setRestockingFeed] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: FEED_CATEGORIES.CONCENTRATE,
    unit: FEED_UNITS.KG,
    stockQuantity: 0,
    minStockAlert: 0,
    costPerUnit: 0,
    protein: 0,
    energy: 0,
    fiber: 0,
    fat: 0,
    calcium: 0,
    phosphorus: 0,
    description: "",
  });

  const [restockData, setRestockData] = useState({
    quantity: 0,
    price: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Listen for restock events from calculator
  useEffect(() => {
    const handleRestockEvent = (e) => {
      if (e.detail?.feedItem) {
        handleRestock(e.detail.feedItem);
      }
    };
    window.addEventListener("openRestock", handleRestockEvent);
    return () => {
      window.removeEventListener("openRestock", handleRestockEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFeedItems = useCallback(async () => {
    if (!farmId) {
      setLoading(false);
      setError("No farm ID found. Please make sure you are logged in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [itemsData, mixesData] = await Promise.all([
        feedInventoryService.getByFarmId(farmId),
        feedMixService.getByFarmId(farmId),
      ]);
      setFeedItems(itemsData || []);
      setFeedMixes(mixesData || []);
    } catch (error) {
      console.error("Error loading feed data:", error);
      setError("Failed to load data: " + error.message);
      setToastMessage("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadFeedItems();
  }, [loadFeedItems]);

  const handleAddFeed = () => {
    setEditingFeed(null);
    setFormData({
      name: "",
      category: FEED_CATEGORIES.CONCENTRATE,
      unit: FEED_UNITS.KG,
      stockQuantity: 0,
      minStockAlert: 0,
      costPerUnit: 0,
      protein: 0,
      energy: 0,
      fiber: 0,
      fat: 0,
      calcium: 0,
      phosphorus: 0,
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleEditFeed = (item) => {
    setEditingFeed(item);
    setFormData({
      name: item.name || "",
      category: item.category || FEED_CATEGORIES.CONCENTRATE,
      unit: item.unit || FEED_UNITS.KG,
      stockQuantity: item.stockQuantity || 0,
      minStockAlert: item.minStockAlert || 0,
      costPerUnit: item.costPerUnit || 0,
      protein: item.protein || 0,
      energy: item.energy || 0,
      fiber: item.fiber || 0,
      fat: item.fat || 0,
      calcium: item.calcium || 0,
      phosphorus: item.phosphorus || 0,
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleRestock = (item) => {
    setRestockingFeed(item);
    setRestockData({
      quantity: 0,
      price: item.costPerUnit || 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsRestockModalOpen(true);
  };

  const handleFeedChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRestockChange = (e) => {
    const { name, value } = e.target;
    setRestockData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedSubmit = async () => {
    try {
      if (!farmId) {
        setToastMessage("No farm ID found. Please log in again.");
        return;
      }

      const dataToSave = {
        farmId: farmId,
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        stockQuantity: parseFloat(formData.stockQuantity) || 0,
        minStockAlert: parseFloat(formData.minStockAlert) || 0,
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
        protein: parseFloat(formData.protein) || 0,
        energy: parseFloat(formData.energy) || 0,
        fiber: parseFloat(formData.fiber) || 0,
        fat: parseFloat(formData.fat) || 0,
        calcium: parseFloat(formData.calcium) || 0,
        phosphorus: parseFloat(formData.phosphorus) || 0,
        description: formData.description || "",
        updatedAt: new Date(),
      };

      if (editingFeed) {
        await feedInventoryService.update(editingFeed.id, dataToSave);
        setToastMessage("Feed updated successfully!");
      } else {
        dataToSave.createdAt = new Date();
        await feedInventoryService.add(dataToSave);
        setToastMessage("Feed added successfully!");
      }

      await loadFeedItems();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving feed:", error);
      setToastMessage("Failed to save feed: " + error.message);
    }
  };

  const handleRestockSubmit = async () => {
    if (!restockingFeed) return;
    try {
      await feedInventoryService.restock(
        restockingFeed.id,
        parseFloat(restockData.quantity),
        parseFloat(restockData.price),
        restockData.purchaseDate,
        restockData.notes,
      );
      setToastMessage(
        `Restocked ${restockData.quantity} ${restockingFeed.unit} of ${restockingFeed.name}`,
      );
      await loadFeedItems();
      setIsRestockModalOpen(false);
    } catch (error) {
      console.error("Error restocking feed:", error);
      setToastMessage("Failed to restock: " + error.message);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await feedInventoryService.delete(itemToDelete.id);
      setToastMessage(`Deleted ${itemToDelete.name}`);
      await loadFeedItems();
    } catch (error) {
      console.error("Error deleting feed:", error);
      setToastMessage("Failed to delete feed.");
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const totalItems = feedItems.length;
  const totalStock = feedItems.reduce(
    (sum, item) => sum + (item.stockQuantity || 0),
    0,
  );
  const lowStockItems = feedItems.filter(
    (item) => (item.stockQuantity || 0) <= (item.minStockAlert || 0),
  );
  const totalValue = feedItems.reduce(
    (sum, item) => sum + (item.stockQuantity || 0) * (item.costPerUnit || 0),
    0,
  );

  // Loading State
  if (loading) {
    return (
      <div className="panel active">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader size="large" />
          <p style={{ marginLeft: "16px", color: "#766d5d" }}>
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="panel active">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--danger)",
          }}
        >
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => loadFeedItems()}
            style={{ marginTop: "16px" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Feed Inventory</h2>
          <div className="desc">
            Manage feed stock, costs, nutrient composition, and calculate feed
            requirements
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-primary" onClick={handleAddFeed}>
            + Add Feed
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{totalItems}</span>
          <span className="ov-lbl">Total Feed Items</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{totalStock.toFixed(1)} kg</span>
          <span className="ov-lbl">Total Stock</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.08)" }}
        >
          <span className="ov-num">{lowStockItems.length}</span>
          <span className="ov-lbl">Low Stock Alerts</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.08)" }}
        >
          <span className="ov-num">{formatCurrencyFull(totalValue)}</span>
          <span className="ov-lbl">Total Inventory Value</span>
        </div>
      </div>

      {/* Tabs - TOP */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "2px solid var(--line)",
          marginBottom: "16px",
        }}
      >
        <button
          className={`btn ${
            activeTab === "inventory" ? "btn-primary" : "btn-ghost"
          }`}
          style={{
            borderRadius: "8px 8px 0 0",
            padding: "8px 20px",
            borderBottom:
              activeTab === "inventory" ? "3px solid var(--pasture)" : "none",
          }}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
        <button
          className={`btn ${
            activeTab === "calculator" ? "btn-primary" : "btn-ghost"
          }`}
          style={{
            borderRadius: "8px 8px 0 0",
            padding: "8px 20px",
            borderBottom:
              activeTab === "calculator" ? "3px solid var(--pasture)" : "none",
          }}
          onClick={() => setActiveTab("calculator")}
        >
          Feed Calculator
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "inventory" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Feed Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Min Alert</th>
                <th>Cost/Unit</th>
                <th>Protein %</th>
                <th>Energy</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty">
                    No feed items added. Click "Add Feed" to get started.
                  </td>
                </tr>
              ) : (
                feedItems.map((item) => {
                  const isLowStock =
                    (item.stockQuantity || 0) <= (item.minStockAlert || 0);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        backgroundColor: isLowStock ? "#fff3cd" : "transparent",
                      }}
                    >
                      <td>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <span
                            style={{
                              fontSize: "0.5rem",
                              color: "#766d5d",
                              display: "block",
                            }}
                          >
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="pill" style={{ fontSize: "0.5rem" }}>
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: isLowStock
                              ? "var(--danger)"
                              : "var(--pasture)",
                          }}
                        >
                          {item.stockQuantity || 0}
                        </strong>
                      </td>
                      <td>{item.unit}</td>
                      <td>
                        <span
                          style={{
                            color: isLowStock ? "var(--danger)" : "#766d5d",
                            fontWeight: isLowStock ? 700 : 400,
                          }}
                        >
                          {item.minStockAlert || 0}
                          {isLowStock && (
                            <span
                              style={{
                                fontSize: "0.5rem",
                                display: "block",
                                color: "var(--danger)",
                              }}
                            >
                              Low Stock!
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                          PKR {item.costPerUnit || 0}
                        </span>
                      </td>
                      <td>{item.protein || 0}%</td>
                      <td>{item.energy || 0}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <button
                            className="btn btn-ghost btn-small"
                            onClick={() => handleRestock(item)}
                          >
                            Restock
                          </button>
                          <button
                            className="btn btn-ghost btn-small"
                            onClick={() => handleEditFeed(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteClick(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <FeedCalculatorTab
          farmId={farmId}
          feedMixes={feedMixes}
          feedItems={feedItems}
        />
      )}

      {/* Add/Edit Feed Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFeed ? "Edit Feed" : "Add Feed"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFeedSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field full-width">
              <Input
                label="Feed Name *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFeedChange}
                placeholder="e.g., Corn, Soybean, Alfalfa"
                required
              />
            </div>

            <div className="field half">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFeedChange}
                className="field-input"
              >
                {Object.values(FEED_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="field half">
              <label>Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleFeedChange}
                className="field-input"
              >
                {Object.values(FEED_UNITS).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="field half">
              <Input
                label="Stock Quantity"
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleFeedChange}
                step="0.1"
                min="0"
              />
            </div>

            <div className="field half">
              <Input
                label="Min Stock Alert"
                type="number"
                name="minStockAlert"
                value={formData.minStockAlert}
                onChange={handleFeedChange}
                step="0.1"
                min="0"
                placeholder="e.g., 10"
              />
            </div>

            <div className="field half">
              <Input
                label="Cost Per Unit (PKR)"
                type="number"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleFeedChange}
                step="10"
                min="0"
                placeholder="e.g., 1500"
              />
            </div>

            <div
              className="field full-width"
              style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}
            >
              <label style={{ fontWeight: 700 }}>Nutrient Composition</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <Input
                  label="Protein %"
                  type="number"
                  name="protein"
                  value={formData.protein}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                  max="100"
                />
                <Input
                  label="Energy"
                  type="number"
                  name="energy"
                  value={formData.energy}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                />
                <Input
                  label="Fiber %"
                  type="number"
                  name="fiber"
                  value={formData.fiber}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                  max="100"
                />
                <Input
                  label="Fat %"
                  type="number"
                  name="fat"
                  value={formData.fat}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                  max="100"
                />
                <Input
                  label="Calcium %"
                  type="number"
                  name="calcium"
                  value={formData.calcium}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                  max="100"
                />
                <Input
                  label="Phosphorus %"
                  type="number"
                  name="phosphorus"
                  value={formData.phosphorus}
                  onChange={handleFeedChange}
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="field full-width">
              <Input
                label="Description"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFeedChange}
                placeholder="Any additional details..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFeed ? "Update Feed" : "Add Feed"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={`Restock: ${restockingFeed?.name || ""}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRestockSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field half">
              <Input
                label="Quantity *"
                type="number"
                name="quantity"
                value={restockData.quantity}
                onChange={handleRestockChange}
                step="0.1"
                min="0.1"
                required
              />
            </div>

            <div className="field half">
              <Input
                label="Price per Unit (PKR)"
                type="number"
                name="price"
                value={restockData.price}
                onChange={handleRestockChange}
                step="10"
                min="0"
              />
            </div>

            <div className="field half">
              <Input
                label="Purchase Date"
                type="date"
                name="purchaseDate"
                value={restockData.purchaseDate}
                onChange={handleRestockChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="field half">
              <Input
                label="Notes"
                type="text"
                name="notes"
                value={restockData.notes}
                onChange={handleRestockChange}
                placeholder="Any notes about this purchase..."
              />
            </div>

            {restockData.quantity > 0 && restockingFeed && (
              <div
                className="field full-width"
                style={{
                  backgroundColor: "rgba(15, 122, 117, 0.05)",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <strong>
                  Current Stock: {restockingFeed.stockQuantity || 0}{" "}
                  {restockingFeed.unit}
                </strong>
                <br />
                <strong style={{ color: "var(--pasture)" }}>
                  New Stock:{" "}
                  {(restockingFeed.stockQuantity || 0) +
                    parseFloat(restockData.quantity || 0)}{" "}
                  {restockingFeed.unit}
                </strong>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setIsRestockModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Restock</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Feed"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Inventory;
