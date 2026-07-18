import React from "react";

const Reports = () => {
  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2> Reports</h2>
          <div className="desc">Export PDF / Excel</div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "10px",
        }}
      >
        <button className="btn btn-primary">Goat Report</button>
        <button className="btn btn-primary">Milk Report</button>
        <button className="btn btn-primary">Feed Report</button>
        <button className="btn btn-primary">Financial</button>
        <button className="btn btn-ghost"> PDF</button>
        <button className="btn btn-ghost"> Excel</button>
      </div>
    </div>
  );
};

export default Reports;
