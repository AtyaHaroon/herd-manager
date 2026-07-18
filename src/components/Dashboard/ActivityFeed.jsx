import React from "react";
import { formatDate } from "../../utils/helpers";

const ActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="empty" style={{ gridColumn: "1 / -1" }}>
        No activity yet
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="activity-item"
          style={{
            animationDelay: `${index * 0.08}s`,
            opacity: 0,
            animation: `fadeUp 0.5s ease ${index * 0.08}s forwards`,
          }}
        >
          <div className={`activity-icon ${activity.type}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {activity.type === "milk" ? (
                <path d="M2 8h20M6 8v11a2 2 0 002 2h8a2 2 0 002-2V8M12 4v4M8 4l1 4M16 4l-1 4" />
              ) : (
                <circle cx="12" cy="12" r="9" />
              )}
            </svg>
          </div>
          <div className="activity-content">
            <div className="act-title">{activity.title}</div>
            <div className="act-desc">{activity.desc}</div>
            <div className="act-date">{formatDate(activity.date)}</div>
          </div>
          <span className={`activity-tag ${activity.type}-tag`}>
            {activity.type === "milk" ? "Milk" : "Vaccine"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
