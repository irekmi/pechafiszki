import { QUEUE_PATH } from "./adminQueueParams";

/**
 * Where an administrator returns to after SCR-12 or SCR-09 finishes with a card. SCR-18 does not exist
 * until ST-17, so for now that is SCR-16; ST-17 changes this one constant.
 */
export const ADMIN_CARDS_PATH = QUEUE_PATH;

/** The first crumb of SCR-12 for an administrator; "Wszystkie fiszki" once SCR-18 exists. */
export const ADMIN_CARDS_LABEL = "Oczekujące";
