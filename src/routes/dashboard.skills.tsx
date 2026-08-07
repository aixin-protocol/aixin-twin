import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/skills")({
  component: () => <Outlet />,
  head: () => ({
    meta: [
      { title: "Skills & Marketplace · AiXin" },
      { name: "description", content: "Install skills, browse the marketplace, or craft a new skill with SkillCraft." },
      { property: "og:title", content: "Skills & Marketplace · AiXin" },
      { property: "og:description", content: "Install skills, browse the marketplace, or craft a new skill with SkillCraft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
