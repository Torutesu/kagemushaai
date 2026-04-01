import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({
      href: "mailto:support@kagemusha.ai",
    } as any);
  },
});
