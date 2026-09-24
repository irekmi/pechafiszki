"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip, Chips } from "@/components/ui/Chip";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ButtonGroup, MarkButton } from "@/components/ui/MarkButton";
import { Modal } from "@/components/ui/Modal";
import { Row } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import { KitSection } from "./KitSection";

const TABS = [
  { id: "pending", label: "Oczekujące (7)" },
  { id: "approved", label: "Zatwierdzone (312)" },
] as const;

export function KitControls() {
  const [tab, setTab] = useState<string>("pending");
  const [chip, setChip] = useState("all");
  const [mark, setMark] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <KitSection title="Oceny, chipsy, zakładki">
        <ButtonGroup>
          <MarkButton tone="know" selected={mark === "know"} onClick={() => setMark("know")}>
            Umiem
          </MarkButton>
          <MarkButton tone="repeat" selected={mark === "repeat"} onClick={() => setMark("repeat")}>
            Do powtórki
          </MarkButton>
          <MarkButton
            tone="unknown"
            selected={mark === "unknown"}
            onClick={() => setMark("unknown")}
          >
            Nie umiem
          </MarkButton>
        </ButtonGroup>
        <Chips>
          <Chip active={chip === "all"} onClick={() => setChip("all")} count={312}>
            Wszystkie
          </Chip>
          <Chip active={chip === "php"} onClick={() => setChip("php")} count={42}>
            PHP
          </Chip>
        </Chips>
        <Tabs items={TABS} value={tab} onChange={setTab} />
        <PasswordInput id="kit-password" placeholder="Hasło" />
      </KitSection>

      <KitSection title="Modal i komunikat">
        <Row>
          <Button onClick={() => setModalOpen(true)}>Otwórz modal</Button>
          <Button variant="primary" onClick={() => setToast("Zapisano ocenę")}>
            Pokaż komunikat
          </Button>
        </Row>
      </KitSection>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Usunąć tę kategorię?"
        text="Usunąć można tylko kategorię bez fiszek."
        actions={
          <>
            <Button onClick={() => setModalOpen(false)}>Anuluj</Button>
            <Button variant="danger-solid" onClick={() => setModalOpen(false)}>
              Usuń kategorię
            </Button>
          </>
        }
      />
      <Toast message={toast} onHide={() => setToast(null)} />
    </>
  );
}
