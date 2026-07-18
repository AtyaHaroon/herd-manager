import React from "react";

const Loader = ({ size = "medium", fullPage = false }) => {
  const loaderClass = `loader loader-${size}`;

  if (fullPage) {
    return (
      <div className="loader-full-page">
        <div className={loaderClass}></div>
      </div>
    );
  }

  return <div className={loaderClass}></div>;
};

export default Loader;
