/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ModeToggle } from "@/shared/components/mode-toggle";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">{t("app.title")}</h1>
      <ModeToggle />
    </main>
  );
}
