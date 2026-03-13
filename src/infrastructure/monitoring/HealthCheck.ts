/**
 * HealthCheck - Verificación de salud del sistema
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthStatus>;
  timestamp: string;
}

export interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  description?: string;
  responseTime?: number;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<HealthStatus>> = new Map();

  register(name: string, check: () => Promise<HealthStatus>): void {
    this.checks.set(name, check);
  }

  async getHealth(): Promise<HealthCheckResult> {
    const checkResults: Record<string, HealthStatus> = {};

    for (const [name, check] of this.checks) {
      try {
        const checkStart = Date.now();
        const result = await check();
        const responseTime = Date.now() - checkStart;
        checkResults[name] = { ...result, responseTime };
      } catch (error) {
        checkResults[name] = {
          status: 'fail',
          description: (error as Error).message,
        };
      }
    }

    const overallStatus = this.calculateOverallStatus(checkResults);

    return {
      status: overallStatus,
      checks: checkResults,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateOverallStatus(checks: Record<string, HealthStatus>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map((c) => c.status);

    if (statuses.every((s) => s === 'pass')) return 'healthy';
    if (statuses.some((s) => s === 'fail')) return 'unhealthy';
    return 'degraded';
  }
}

export const healthChecker = new HealthChecker();
