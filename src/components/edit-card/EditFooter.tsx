import { Button, ButtonLink } from "@/components/ui/Button";
import { CardFoot } from "@/components/ui/Card";
import { Row } from "@/components/ui/Page";
import { DeleteCard } from "./DeleteCard";

type EditFooterProps = {
  id: number;
  isAdmin: boolean;
  /** The form is read-only (DEC-58): nothing to delete or send. */
  locked: boolean;
  pending: boolean;
  cancelHref: string;
};

/**
 * SCR-12 elements 11, 14 and 15. The author's save is the author's: an administrator saves through the
 * block beside the form (API-22), so the button is not drawn for one.
 */
export function EditFooter({ id, isAdmin, locked, pending, cancelHref }: EditFooterProps) {
  return (
    <CardFoot>
      <Row between>
        {locked ? <span /> : <DeleteCard id={id} asAdmin={isAdmin} />}
        <Row>
          <ButtonLink href={cancelHref}>Anuluj</ButtonLink>
          {isAdmin || locked ? null : (
            <Button type="submit" variant="primary" disabled={pending}>
              Zapisz i wyślij do zatwierdzenia
            </Button>
          )}
        </Row>
      </Row>
    </CardFoot>
  );
}
