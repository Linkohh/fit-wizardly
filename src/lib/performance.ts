/**
 * Performance profiling utilities for plan generation
 */

interface PerformanceMetrics {
    operation: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100;

/**
 * Measure execution time of a function
 */
export function measureTime<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    recordMetric(operation, duration, metadata);
    return result;
}

/**
 * Measure execution time of an async function
 */
export async function measureTimeAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    recordMetric(operation, duration, metadata);
    return result;
}

/**
 * Record a performance metric
 */
function recordMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
) {
    const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: Date.now(),
        metadata,
    };

    metrics.push(metric);

    // Keep only recent metrics
    if (metrics.length > MAX_METRICS) {
        metrics.shift();
    }

    // Log slow operations
    if (duration > 100) {
        console.warn(`[Perf] Slow operation: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    } else if (import.meta.env.DEV) {
        console.log(`[Perf] ${operation}: ${duration.toFixed(2)}ms`);
    }
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
    const byOperation: Record<string, { count: number; total: number; avg: number; max: number }> = {};

    for (const metric of metrics) {
        if (!byOperation[metric.operation]) {
            byOperation[metric.operation] = { count: 0, total: 0, avg: 0, max: 0 };
        }

        const stats = byOperation[metric.operation];
        stats.count++;
        stats.total += metric.duration;
        stats.avg = stats.total / stats.count;
        stats.max = Math.max(stats.max, metric.duration);
    }

    return {
        metrics,
        summary: byOperation,
        totalOperations: metrics.length,
    };
}

/**
 * Clear metrics
 */
export function clearMetrics() {
    metrics.length = 0;
}

/**
 * Benchmark plan generation with given inputs
 */
export function benchmarkPlanGeneration(
    generateFn: (inputs: any) => any,
    testInputs: any[],
    iterations: number = 10
) {
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
        for (const input of testInputs) {
            const duration = measureTime('benchmark_plan_generation', () => generateFn(input), {
                iteration: i,
                inputSize: JSON.stringify(input).length,
            });
            results.push(performance.now()); // Just for type safety
        }
    }

    const durations = metrics
        .filter(m => m.operation === 'benchmark_plan_generation')
        .map(m => m.duration);

    return {
        iterations: iterations * testInputs.length,
        avgMs: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxMs: Math.max(...durations),
        minMs: Math.min(...durations),
        p95Ms: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
    };
}
