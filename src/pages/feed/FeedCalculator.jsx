// src/pages/FeedCalculator.jsx - NEW COMPONENT

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { feedMixService } from "../services/feedMixService";
import { feedInventoryService } from "../services/feedInventoryService";
import { goatService } from "../services/goatService";
import Loader from "../components/Common/Loader";
import Toast from "../components/Common/Toast";
import Button from "../components/Common/Button";

const FeedCalculator = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [feedMixes, setFeedMixes] = useState([]);
  const [goats, setGoats] = useState([]);
  const [selectedMixId, setSelectedMixId] = useState("");
  const [feedPlan, setFeedPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [feedItems, setFeedItems] = useState([]);

  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [mixesData, goatsData, feedData] = await Promise.all([
        feedMixService.getByFarmId(farmId),
        goatService.getByFarmId(farmId),
        feedInventoryService.getByFarmId(farmId),
      ]);
      setFeedMixes(mixesData || []);
      setGoats(goatsData || []);
      setFeedItems(feedData || []);

      if (mixesData && mixesData.length > 0) {
        setSelectedMixId(mixesData[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setToastMessage("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateFeedPlan = async () => {
    if (!selectedMixId) {
      setToastMessage("Please select a feed mix");
      return;
    }

    setCalculating(true);
    try {
      const plan = await feedMixService.getFeedingPlanWithInventory(
        farmId,
        selectedMixId,
      );
      setFeedPlan(plan);
    } catch (error) {
      console.error("Error calculating feed plan:", error);
      setToastMessage("Failed to calculate feed plan: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

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

  const goatStats = getGoatStats();

  if (loading) {
    return (
      <div className="panel active">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>📊 Feed Calculator</h2>
          <div className="desc">
            Calculate feed requirements based on goat weights (3.5% of body
            weight)
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={calculateFeedPlan}
          disabled={calculating || !selectedMixId}
        >
          {calculating ? "Calculating..." : "Calculate Feed Plan"}
        </button>
      </div>

      {/* Goat Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{goatStats.total}</span>
          <span className="ov-lbl">Total Goats</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{goatStats.withWeight}</span>
          <span className="ov-lbl">With Weight Record</span>
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

      {/* Select Feed Mix */}
      <div className="filter-bar" style={{ flexWrap: "wrap", gap: "12px" }}>
        <select
          value={selectedMixId}
          onChange={(e) => setSelectedMixId(e.target.value)}
          style={{ minWidth: "250px", padding: "8px 12px" }}
        >
          {feedMixes.length === 0 ? (
            <option value="">No feed mixes available</option>
          ) : (
            feedMixes.map((mix) => (
              <option key={mix.id} value={mix.id}>
                {mix.name} (Protein: {mix.protein?.toFixed(1) || 0}%)
              </option>
            ))
          )}
        </select>
        <span style={{ fontSize: "0.7rem", color: "#766d5d" }}>
          Feed: 3.5% of body weight
        </span>
      </div>

      {/* Feed Plan Results */}
      {feedPlan && (
        <div className="feed-plan-results" style={{ marginTop: "20px" }}>
          {/* Summary Card */}
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
                  Total Feed Required
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--pasture)" }}>
                  {feedPlan.totalFeedRequired.toFixed(1)} kg
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Per day
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Monthly Requirement
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--gold)" }}>
                  {feedPlan.monthlyRequirement.toFixed(1)} kg
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
                  PKR {feedPlan.totalDailyCost?.toFixed(0) || 0}
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Per day
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                  Monthly Cost
                </span>
                <br />
                <strong style={{ fontSize: "1.4rem", color: "var(--gold)" }}>
                  PKR {feedPlan.totalMonthlyCost?.toFixed(0) || 0}
                </strong>
                <br />
                <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                  Per month (30 days)
                </span>
              </div>
            </div>

            {/* Per Goat Breakdown */}
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
                    Per Goat Feed Requirement (3.5% of body weight)
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 12px",
                      marginTop: "6px",
                    }}
                  >
                    {feedPlan.perGoatBreakdown.slice(0, 10).map((g) => (
                      <span
                        key={g.goatId}
                        style={{
                          fontSize: "0.6rem",
                          background: "rgba(15, 122, 117, 0.06)",
                          padding: "2px 10px",
                          borderRadius: "12px",
                        }}
                      >
                        <strong>{g.tagId}</strong>: {g.feedRequired.toFixed(2)}{" "}
                        kg
                        <span style={{ color: "#766d5d", fontSize: "0.5rem" }}>
                          {" "}
                          ({g.weight} kg)
                        </span>
                      </span>
                    ))}
                    {feedPlan.perGoatBreakdown.length > 10 && (
                      <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                        +{feedPlan.perGoatBreakdown.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Ingredient Requirements */}
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ fontSize: "0.85rem", marginBottom: "12px" }}>
              Ingredient Requirements
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
                  </tr>
                </thead>
                <tbody>
                  {feedPlan.inventoryStatus?.map((ing) => (
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
                          {ing.currentStock.toFixed(2)} kg
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary of Inventory Status */}
            {feedPlan.summary && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
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
                  Days available: {feedPlan.summary.totalDaysAvailable} days
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="primary"
              onClick={calculateFeedPlan}
              disabled={calculating}
            >
              Recalculate
            </Button>
           
          </div>
        </div>
      )}

      {/* No feed mixes message */}
      {feedMixes.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#766d5d",
            backgroundColor: "rgba(15, 122, 117, 0.04)",
            borderRadius: "12px",
          }}
        >
          <p>No feed mixes available.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
            Go to <strong>Feed Mixes</strong> to create a feed mix first.
          </p>
        </div>
      )}

      {/* No goats with weight message */}
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
            weights to goats for accurate calculations.
          </span>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default FeedCalculator;
