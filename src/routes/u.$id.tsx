import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/u/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/clubedascolecionadoras/album/u/$id",
      params: { id: params.id },
      replace: true,
    });
  },
  component: () => null,
});
