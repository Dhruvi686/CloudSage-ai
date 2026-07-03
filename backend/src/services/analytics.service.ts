/**
 * CloudSight AI — Analytics Service
 *
 * Core integration layer between the Express backend and the
 * Python analytics engines. Responsibilities:
 *
 * - Copy uploaded CSVs to analytics/data/
 * - Spawn `python -m analytics.main` via child_process
 * - Read and parse analytics/data/results.json
 * - Cache results in memory for subsequent GET endpoints
 * - Handle analytics failures with structured errors
 *
 * The Python analytics pipeline is the single source of truth
 * for all business logic. This service NEVER performs calculations.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import { config } from '../config';
import type { AnalyticsResults } from '../types';
import { AnalyticsError, NoDataError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const execFileAsync = promisify(execFile);
const logger = createLogger('analytics-service');

/**
 * In-memory cache for analytics results.
 * Populated after a successful upload + analytics run.
 * All GET endpoints read from this cache.
 */
let cachedResults: AnalyticsResults | null = null;

/** Path to the analytics data directory */
const analyticsDataDir = path.join(config.analyticsPath, 'data');

/** Path to results.json */
const resultsPath = path.join(analyticsDataDir, 'results.json');

/**
 * Copy uploaded CSV files to the analytics data directory.
 *
 * @param files - Map of field name to Multer file objects.
 */
export async function copyUploadsToAnalytics(
  files: Record<string, Express.Multer.File[]>
): Promise<void> {
  // Ensure analytics data directory exists
  if (!fs.existsSync(analyticsDataDir)) {
    fs.mkdirSync(analyticsDataDir, { recursive: true });
  }

  const fileMapping: Record<string, string> = {
    ec2: 'ec2.csv',
    s3: 's3.csv',
    ebs: 'ebs.csv',
    rds: 'rds.csv',
    monthlyCost: 'monthly_cost.csv',
  };

  for (const [fieldName, targetName] of Object.entries(fileMapping)) {
    const fileArray = files[fieldName];
    if (fileArray && fileArray.length > 0) {
      const source = fileArray[0].path;
      const dest = path.join(analyticsDataDir, targetName);

      fs.copyFileSync(source, dest);
      logger.info(`Copied ${fieldName} -> ${targetName}`, { source, dest });
    }
  }
}

/**
 * Execute the Python analytics pipeline.
 *
 * Spawns `python -m analytics.main` and waits for completion.
 * Timeout is configurable via ANALYTICS_TIMEOUT env var.
 *
 * @throws AnalyticsError if the pipeline fails or times out.
 */
export async function runAnalyticsPipeline(): Promise<void> {
  logger.info('Starting analytics pipeline...');
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync(
      'python',
      ['-m', 'analytics.main'],
      {
        cwd: path.resolve(config.analyticsPath, '..'),
        timeout: config.analyticsTimeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    );

    const duration = Date.now() - startTime;
    logger.info(`Analytics pipeline completed in ${duration}ms`);

    if (stdout) {
      // Log last few lines of stdout for summary
      const lines = stdout.trim().split('\n');
      const summary = lines.slice(-5).join('\n');
      logger.debug('Pipeline output (tail):\n' + summary);
    }

    if (stderr) {
      logger.warn('Pipeline stderr output', { stderr: stderr.substring(0, 500) });
    }
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error(`Analytics pipeline failed after ${duration}ms`, {
      error: err.message,
      exitCode: err.code,
    });

    if (err.killed) {
      throw new AnalyticsError(
        `Analytics pipeline timed out after ${config.analyticsTimeout / 1000}s`,
        { timeout: config.analyticsTimeout }
      );
    }

    throw new AnalyticsError(
      `Analytics pipeline failed: ${err.message}`,
      { stderr: err.stderr?.substring(0, 1000), exitCode: err.code }
    );
  }
}

/**
 * Load and cache analytics results from results.json.
 *
 * @returns Parsed AnalyticsResults.
 * @throws AnalyticsError if results.json is missing or invalid.
 */
export async function loadResults(): Promise<AnalyticsResults> {
  if (!fs.existsSync(resultsPath)) {
    throw new AnalyticsError(
      'Analytics results not found. Pipeline may have failed.',
      { path: resultsPath }
    );
  }

  try {
    const raw = fs.readFileSync(resultsPath, 'utf-8');
    const data = JSON.parse(raw) as AnalyticsResults;

    // Cache the results
    cachedResults = data;

    logger.info('Analytics results loaded', {
      recommendations: data.recommendations.length,
      score: data.score.score,
    });

    return data;
  } catch (err: any) {
    throw new AnalyticsError(
      `Failed to parse results.json: ${err.message}`,
      { path: resultsPath }
    );
  }
}

/**
 * Get cached analytics results.
 *
 * If no cached results exist, attempts to load from disk.
 * If no results file exists, throws NoDataError.
 *
 * @returns Cached AnalyticsResults.
 * @throws NoDataError if no analytics have been run.
 */
export function getCachedResults(): AnalyticsResults {
  if (cachedResults) {
    return cachedResults;
  }

  // Try loading from disk (may exist from a previous run)
  if (fs.existsSync(resultsPath)) {
    try {
      const raw = fs.readFileSync(resultsPath, 'utf-8');
      cachedResults = JSON.parse(raw) as AnalyticsResults;
      logger.info('Loaded cached results from disk');
      return cachedResults;
    } catch {
      // Fall through to NoDataError
    }
  }

  throw new NoDataError();
}

/**
 * Clean up temporary upload files.
 */
export function cleanupUploads(files: Record<string, Express.Multer.File[]>): void {
  for (const fileArray of Object.values(files)) {
    for (const file of fileArray) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        // Best-effort cleanup
      }
    }
  }
}
