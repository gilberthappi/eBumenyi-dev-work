import React from "react";
import { Outlet } from "react-router-dom";

const LearningLayout: React.FC = () => {
  return (
    <div className="h-screen overflow-hidden bg-white">
      <Outlet />
    </div>
  );
};

export default LearningLayout;
