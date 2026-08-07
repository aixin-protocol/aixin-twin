import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/specialists")({
  component: () => <Outlet />,
  head: () => ({
    meta: [
      { title: "Specialist Twins · AiXin" },
      { name: "description", content: "Manage your team of Specialist Twins and their assigned skills." },
      { property: "og:title", content: "Specialist Twins · AiXin" },
      { property: "og:description", content: "Manage your team of Specialist Twins and their assigned skills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
