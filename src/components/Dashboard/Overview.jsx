import React from "react";

const Overview = ({ items }) => {
  return (
    <div className="overview-grid">
      {items.map((item, index) => (
        <div key={index} className="ov-card">
          <div className="ov-icon">{item.icon}</div>
          <span className="ov-num">{item.num}</span>
          <span className="ov-lbl">{item.lbl}</span>
        </div>
      ))}
    </div>
  );
};

export default Overview;
