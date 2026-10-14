/**
 * Router and providers only.
 *
 * The generator/sequencer page and the saved-compositions library page are
 * built by separate tasks; this file registers their routes and renders the
 * shared Layout shell.
 */

import { Layout } from "@/components/Layout";
import { LibraryPage } from "@/pages/LibraryPage";
import { StudioPage } from "@/pages/StudioPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const studioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: StudioPage,
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/library",
  component: LibraryPage,
});

const routeTree = rootRoute.addChildren([studioRoute, libraryRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
