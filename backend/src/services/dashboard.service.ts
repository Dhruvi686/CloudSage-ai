/**
 * CloudSight AI — Dashboard Service
 *
 * Returns executive dashboard metrics from cached analytics results.
 * Response matches DashboardResponse from API-Specification.yaml.
 */

import { getCachedResults } from './analytics.service';
import type { DashboardResponse } from '../types';

/**
 * Get dashboard metrics.
 * Reads directly from the `dashboard` section of results.json.
 */
export function getDashboard(): DashboardResponse {
  const results = getCachedResults();
  return results.dashboard;
}
