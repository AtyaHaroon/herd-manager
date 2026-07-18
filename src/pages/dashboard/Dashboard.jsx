import React, { useState, useEffect } from "react";
import DashboardCards from "../../components/Dashboard/DashboardCards";
import ActivityFeed from "../../components/Dashboard/ActivityFeed";
import Overview from "../../components/Dashboard/Overview";
import { formatDate, calculateTotals } from "../../utils/helpers";

const Dashboard = () => {
  // In a real app, this data would come from Firebase or a backend
  const [goats, setGoats] = useState([]);
  const [milk, setMilk] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [finance, setFinance] = useState([]);
  const [pregnancy, setPregnancy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage or API
    const loadData = () => {
      const savedData = localStorage.getItem("goatManagerData");
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          setGoats(data.goats || []);
          setMilk(data.milk || []);
          setVaccines(data.vaccines || []);
          setFinance(data.finance || []);
          setPregnancy(data.pregnancy || []);
        } catch (error) {
          console.error("Error loading data:", error);
          setDefaultData();
        }
      } else {
        setDefaultData();
      }
      setLoading(false);
    };

    const setDefaultData = () => {
      // Default data for demo
      const defaultData = {
        goats: [
          {
            id: "g1",
            name: "Chini",
            tag: "BG-001",
            breed: "Beetal",
            sex: "Female",
            dob: "2023-02-10",
            notes: "Good milker",
          },
          {
            id: "g2",
            name: "Sheru",
            tag: "BG-002",
            breed: "Kamori",
            sex: "Male",
            dob: "2022-11-05",
            notes: "",
          },
          {
            id: "g3",
            name: "Moti",
            tag: "BG-003",
            breed: "Beetal",
            sex: "Female",
            dob: "2024-01-20",
            notes: "Pregnant",
          },
        ],
        milk: [
          {
            id: "m1",
            goatId: "g1",
            date: "2024-07-01",
            time: "Morning",
            amount: 1.6,
            notes: "",
          },
          {
            id: "m2",
            goatId: "g1",
            date: "2024-07-02",
            time: "Evening",
            amount: 1.8,
            notes: "",
          },
        ],
        vaccines: [
          {
            id: "v1",
            goatId: "g1",
            name: "PPR",
            date: "2024-05-01",
            next: "2024-12-01",
            notes: "Booster",
          },
        ],
        pregnancy: [
          {
            id: "p1",
            goatId: "g3",
            dueDate: "2024-08-15",
            status: "Confirmed",
            notes: "Single",
          },
        ],
        finance: [
          {
            id: "fi1",
            date: "2024-07-01",
            type: "Income",
            category: "Milk Sale",
            amount: 250,
            notes: "Weekly",
          },
        ],
      };
      setGoats(defaultData.goats);
      setMilk(defaultData.milk);
      setVaccines(defaultData.vaccines);
      setPregnancy(defaultData.pregnancy);
      setFinance(defaultData.finance);
      localStorage.setItem("goatManagerData", JSON.stringify(defaultData));
    };

    loadData();
  }, []);

  const totalGoats = goats.length;
  const female = goats.filter((g) => g.sex === "Female").length;
  const male = goats.filter((g) => g.sex === "Male").length;
  const pregnant = pregnancy.filter((p) => p.status === "Confirmed").length;
  const todayMilk = milk
    .filter((m) => m.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const totalIncome = calculateTotals(finance, "Income");
  const totalExpense = calculateTotals(finance, "Expense");

  const dashboardCards = [
    { label: "Total Goats", value: totalGoats },
    { label: "Female", value: female },
    { label: "Male", value: male },
    { label: "Pregnant", value: pregnant },
    { label: "Today's Milk", value: todayMilk.toFixed(1) + "L" },
    { label: "Income", value: "$" + totalIncome.toFixed(0) },
    { label: "Expense", value: "$" + totalExpense.toFixed(0) },
  ];

  // Build activity feed
  const activities = [];
  milk.slice(0, 4).forEach((m) => {
    const goat = goats.find((g) => g.id === m.goatId);
    activities.push({
      type: "milk",
      date: m.date,
      title: `${m.amount} L milked`,
      desc: `${goat ? goat.name : "Unknown"} · ${m.time}`,
      
    });
  });
  vaccines.slice(0, 4).forEach((v) => {
    const goat = goats.find((g) => g.id === v.goatId);
    activities.push({
      type: "vaccine",
      date: v.date,
      title: `${v.name} given`,
      desc: `${goat ? goat.name : "Unknown"} · next ${formatDate(v.next)}`,
    
    });
  });
  activities.sort((a, b) => b.date.localeCompare(a.date));

  const totalMilkAll = milk.reduce((sum, m) => sum + Number(m.amount), 0);
  const avgPerGoat = goats.length ? totalMilkAll / goats.length : 0;

  const overviewItems = [
    {  num: totalMilkAll.toFixed(1) + " L", lbl: "Total milk" },
    {  num: avgPerGoat.toFixed(2) + " L", lbl: "Avg per goat" },
    {  num: female, lbl: "Females" },
    {  num: 0, lbl: "Vaccines overdue" },
  ];

  if (loading) {
    return <div className="empty">Loading dashboard...</div>;
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2> Dashboard</h2>
          <div className="desc">Herd at a glance</div>
        </div>
      </div>
      <DashboardCards cards={dashboardCards} />
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "10px", fontSize: "1rem" }}>
          Recent Activity
        </h3>
        <ActivityFeed activities={activities.slice(0, 4)} />
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "10px", fontSize: "1rem" }}>
          Herd Overview
        </h3>
        <Overview items={overviewItems} />
      </div>
    </div>
  );
};

export default Dashboard;
