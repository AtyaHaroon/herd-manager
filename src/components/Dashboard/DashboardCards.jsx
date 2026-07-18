import React from "react";

const DashboardCards = ({ cards }) => {
  return (
    <div className="grid">
      {cards.map((card, index) => (
        <div
          key={index}
          className="card"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div style={{ fontSize: "1.3rem" }}>{card.icon}</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {card.value}
          </div>
          <div style={{ color: "#766d5d", fontSize: "0.7rem" }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
