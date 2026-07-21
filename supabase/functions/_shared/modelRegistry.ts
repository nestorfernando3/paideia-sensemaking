import { ModelCost, Snapshot } from "./contracts.ts";
export { extractJsonObject } from "./json.ts";

export const MAX_SNAPSHOT_AGE_MS = 5 * 60 * 1000;

export const ZEN_PUBLIC_PRICE_CONFIRMED_IDS = new Set<string>([
  "nemotron-3-ultra-free",
  "deepseek-v4-flash-free",
  "mimo-v2.5-free",
]);

export const DEFAULT_ORDERED_ALLOWLIST: string[] = [
  "nemotron-3-ultra-free",
  "deepseek-v4-flash-free",
  "mimo-v2.5-free",
];

export function hasExactZeroCost(cost?: ModelCost): boolean {
  return (
    typeof cost?.input === "number" &&
    typeof cost?.output === "number" &&
    cost.input === 0 &&
    cost.output === 0
  );
}

export function selectFreeModels(input: {
  availability: Snapshot<Set<string>>;
  costs: Snapshot<Record<string, ModelCost>>;
  orderedAllowlist?: string[];
  zenPublicPriceConfirmedIds?: Set<string>;
  now?: number;
}): string[] {
  const now = input.now ?? Date.now();
  const allowlist = input.orderedAllowlist ?? DEFAULT_ORDERED_ALLOWLIST;
  const confirmedIds = input.zenPublicPriceConfirmedIds ??
    ZEN_PUBLIC_PRICE_CONFIRMED_IDS;

  if (now - input.availability.fetchedAt > MAX_SNAPSHOT_AGE_MS) {
    return [];
  }

  if (now - input.costs.fetchedAt > MAX_SNAPSHOT_AGE_MS) {
    return [];
  }

  const result: string[] = [];

  for (const candidateId of allowlist) {
    if (!input.availability.data.has(candidateId)) {
      continue;
    }

    const cost = input.costs.data[candidateId];
    if (!hasExactZeroCost(cost)) {
      continue;
    }

    if (!confirmedIds.has(candidateId)) {
      continue;
    }

    result.push(candidateId);
  }

  return result;
}

let cachedAvailability: Snapshot<Set<string>> | null = null;
let cachedCosts: Snapshot<Record<string, ModelCost>> | null = null;

export async function fetchZenModelIds(): Promise<Snapshot<Set<string>>> {
  const now = Date.now();
  if (
    cachedAvailability &&
    now - cachedAvailability.fetchedAt < MAX_SNAPSHOT_AGE_MS
  ) {
    return cachedAvailability;
  }

  const res = await fetch("https://opencode.ai/zen/v1/models");
  if (!res.ok) {
    throw new Error(`ZEN_MODELS_FETCH_FAILED: ${res.status}`);
  }

  const body = (await res.json()) as { data?: Array<{ id: string }> };
  const ids = new Set<string>();
  if (Array.isArray(body?.data)) {
    for (const item of body.data) {
      if (item?.id) ids.add(item.id);
    }
  }

  cachedAvailability = { fetchedAt: now, data: ids };
  return cachedAvailability;
}

export async function fetchOpenCodeModelCosts(): Promise<
  Snapshot<Record<string, ModelCost>>
> {
  const now = Date.now();
  if (cachedCosts && now - cachedCosts.fetchedAt < MAX_SNAPSHOT_AGE_MS) {
    return cachedCosts;
  }

  const res = await fetch("https://models.dev/api.json");
  if (!res.ok) {
    throw new Error(`OPENCODE_MODELS_FETCH_FAILED: ${res.status}`);
  }

  const body = (await res.json()) as {
    opencode?: {
      models?: Record<string, { cost?: { input?: number; output?: number } }>;
    };
  };

  const costs: Record<string, ModelCost> = {};
  const modelsMap = body?.opencode?.models ?? {};

  for (const [id, info] of Object.entries(modelsMap)) {
    if (
      typeof info?.cost?.input === "number" &&
      typeof info?.cost?.output === "number"
    ) {
      costs[id] = {
        input: info.cost.input,
        output: info.cost.output,
      };
    }
  }

  cachedCosts = { fetchedAt: now, data: costs };
  return cachedCosts;
}
