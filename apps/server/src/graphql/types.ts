import type { Metric as CoreMetric } from "../core/metricHelper";

// Extended Metric type with _meta field for GraphQL
export interface MetricWithMeta extends CoreMetric {
  _meta: {
    chainsComplete: string[];
    chainsFailed: string[];
    timestamp: string;
  };
}

// Helper to add metadata to a Metric
export function addMetricMeta(
  metric: CoreMetric,
  successfulChains: string[],
  failedChains: string[]
): MetricWithMeta {
  return {
    ...metric,
    _meta: {
      chainsComplete: successfulChains,
      chainsFailed: failedChains,
      timestamp: new Date().toISOString(),
    },
  };
}
