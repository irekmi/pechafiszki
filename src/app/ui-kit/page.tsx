import { notFound } from "next/navigation";
import { Page } from "@/components/ui/Page";
import { PageTitle } from "@/components/ui/Typography";
import { KitButtons } from "@/components/ui-kit/KitButtons";
import { KitContent } from "@/components/ui-kit/KitContent";
import { KitControls } from "@/components/ui-kit/KitControls";
import { KitFlashcard } from "@/components/ui-kit/KitFlashcard";
import { KitForms } from "@/components/ui-kit/KitForms";
import { KitLists } from "@/components/ui-kit/KitLists";

/** Scratch route for AC-01.4 — renders every element of `src/components/ui/` once. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Page>
      <PageTitle>Elementy interfejsu</PageTitle>
      <div className="mt-7">
        <KitButtons />
        <KitControls />
        <KitContent />
        <KitLists />
        <KitForms />
        <KitFlashcard />
      </div>
    </Page>
  );
}
