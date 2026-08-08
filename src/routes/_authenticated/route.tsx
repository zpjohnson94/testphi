// Integration-managed protected layout. Redirects unauthenticated users to /auth.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession() reads the cached session locally and only hits the network
    // when the token has actually expired; getUser() round-trips to the auth
    // server on every entry into this tree, blocking the route from resolving.
    // This guard is UX routing only — every server function independently
    // verifies the JWT via requireSupabaseAuth, so it need not be authoritative.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
