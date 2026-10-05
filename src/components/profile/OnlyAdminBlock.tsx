import { ONLY_ADMIN_NOTE } from "@/server/services/deleteOwnAccount";
import { Button } from "@/components/ui/Button";
import { Card, CardFoot } from "@/components/ui/Card";
import { AlertIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { Row } from "@/components/ui/Page";

/**
 * SCR-23 element 8 (`DEC-47`) — replaces the form, not the whole screen; the button stays in the
 * markup but inactive, never the only refusal (`deleteOwnAccount` refuses the same call directly).
 */
export function OnlyAdminBlock() {
  return (
    <Card tint flat>
      <Notice tone="danger" icon={<AlertIcon />}>
        {ONLY_ADMIN_NOTE}
      </Notice>
      <CardFoot>
        <Row className="justify-end">
          <Button type="button" variant="danger-solid" disabled>
            Usuń konto trwale
          </Button>
        </Row>
      </CardFoot>
    </Card>
  );
}
