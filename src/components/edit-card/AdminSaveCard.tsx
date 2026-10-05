import { Button } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Page";
import { Hint, SectionTitle } from "@/components/ui/Typography";

type AdminSaveCardProps = { formId: string; pending: boolean; canApprove: boolean };

/**
 * SCR-12 element 12 — **Zapisz zmiany** and **Zapisz i zatwierdź**. Rendered by the screen only for an
 * administrator (DEV-04); the buttons submit the form beside them, and the action tells the two apart by
 * `intent`. An approved card has nothing left to approve, so the second button is not offered for it.
 */
export function AdminSaveCard({ formId, pending, canApprove }: AdminSaveCardProps) {
  return (
    <Card>
      <SectionTitle>Zapis jako administrator</SectionTitle>
      <Hint>Te przyciski widzi tylko administrator otwierający fiszkę z kolejki lub z listy wszystkich fiszek.</Hint>
      <CardFoot>
        <Stack size="sm">
          <Button type="submit" form={formId} name="intent" value="save" block disabled={pending}>
            Zapisz zmiany
          </Button>
          {canApprove ? (
            <Button type="submit" form={formId} name="intent" value="approve" variant="primary" block disabled={pending}>
              Zapisz i zatwierdź
            </Button>
          ) : null}
        </Stack>
      </CardFoot>
    </Card>
  );
}
