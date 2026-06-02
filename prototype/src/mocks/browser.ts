/**
 * MSW browser worker. Started by MswProvider before any authenticated render.
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
