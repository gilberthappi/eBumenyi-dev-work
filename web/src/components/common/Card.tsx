import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = true,
  hover = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${padding ? "p-6" : ""}
        ${hover ? "hover:shadow-md transition-shadow duration-200" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
