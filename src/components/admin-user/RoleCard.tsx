"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Hint, SectionTitle } from "@/components/ui/Typography";
import { changeUserRoleAction } from "@/server/actions/changeUserRole";
import { userHref } from "@/server/services/usersParams";

/** The mockup's standing hint; while a block applies (or an action was refused) its specific note takes its place. */
const HINT = "Na własnym koncie oraz na koncie jedynego administratora przyciski „Zmień rolę” i „Usuń użytkownika” są nieaktywne.";

type RoleCardProps = { id: number; role: Role; canChangeRole: boolean; blockNote: string | null };

/**
 * SCR-20 element 9 and 10: the tinted card with the **Rola** select, **Zmień rolę** and its confirmation
 * modal. Under either block the select and the button are inactive and the note says why; that is
 * presentation only — `changeUserRoleAction` refuses both blocks itself and its note is shown here if it
 * does. The role never leaves this component except as the `{ id, role }` body.
 */
export function RoleCard({ id, role, canChangeRole, blockNote }: RoleCardProps) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Role>(role);
  const [open, setOpen] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, startTransition] = useTransition();
  const hideToast = useCallback(() => setSaved(false), []);

  function confirm() {
    startTransition(async () => {
      const result = await changeUserRoleAction({ id, role: chosen });
      setOpen(false);
      if (result.ok) {
        setRefusal(null);
        setSaved(true);
      } else if (result.reason === "not-found") {
        router.replace(userHref(id));
      } else {
        setRefusal(result.note);
      }
    });
  }

  return (
    <Card tint>
      <SectionTitle>Rola</SectionTitle>
      <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
        <Field label="Rola" htmlFor="role">
          <Select id="role" name="role" required disabled={!canChangeRole} value={chosen} onChange={(event) => setChosen(event.target.value as Role)}>
            <option value="USER">Użytkownik</option>
            <option value="ADMIN">Administrator</option>
          </Select>
        </Field>
        <Button block disabled={!canChangeRole || busy} onClick={() => setOpen(true)}>
          Zmień rolę
        </Button>
        <Hint>{refusal ?? blockNote ?? HINT}</Hint>
      </form>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Zmienić rolę tego użytkownika?"
        text="Administrator zatwierdza i odrzuca fiszki, zarządza kategoriami oraz kontami."
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Anuluj</Button>
            <Button variant="primary" disabled={busy} onClick={confirm}>
              Zmień rolę
            </Button>
          </>
        }
      />
      <Toast message={saved ? "Rola zmieniona" : null} onHide={hideToast} />
    </Card>
  );
}
