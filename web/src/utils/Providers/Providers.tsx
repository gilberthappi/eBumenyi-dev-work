import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import RoutesProvider from "./RoutesProvider";
import { AuthProvider } from "react-auth-kit";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PushBootstrap from "@/components/PushBootstrap";
import { useRef } from "react";

const Providers = () => {
  // QueryClient must be stable — never recreate it on re-renders
  const clientQueryRef = useRef(new QueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={clientQueryRef.current}>
        <AuthProvider authType='localstorage' authName='accessToken'>
          <NotificationsProvider>
            <PushBootstrap />
            <RoutesProvider />
          </NotificationsProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default Providers;
