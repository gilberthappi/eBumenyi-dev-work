import React from "react";

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <header>
        <h1>Welcome to the Guest Area</h1>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default GuestLayout;
