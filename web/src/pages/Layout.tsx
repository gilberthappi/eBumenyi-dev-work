import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;
