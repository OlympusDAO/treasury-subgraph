import type { WebhookConfiguration } from "@wundergraph/sdk/server";
import type { InternalClient } from "./wundergraph.internal.client";
import type { InternalOperationsClient } from "./wundergraph.internal.operations.client";
import { createWebhookFactory } from "@wundergraph/sdk/server";

export type WebhooksConfig = {};

export const createWebhook = createWebhookFactory<InternalOperationsClient, InternalClient>();
