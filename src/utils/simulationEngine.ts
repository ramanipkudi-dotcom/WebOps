import {
  MetricSnapshot,
  ChartDataPoint,
  SimulationEvent,
  ScenarioComparison,
  WebsiteSimulationState,
  ScenarioType
} from '../types/simulation';

// Deterministic hash from hostname string for stable reproducible seed
function hashHostname(hostname: string): number {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = (hash << 5) - hash + hostname.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Configured thresholds
export const BOTTLENECK_THRESHOLD_MS = 320;

export function generateBaselineForHostname(hostname: string): MetricSnapshot {
  const seed = hashHostname(hostname);
  // Latency between 165ms and 215ms
  const responseTimeMs = 165 + (seed % 50);
  // Request rate between 24 and 42 rps
  const requestRateRps = 24 + ((seed >> 2) % 18);
  // Error rate between 0.05% and 0.25%
  const errorRatePercent = Number((0.05 + ((seed % 20) * 0.01)).toFixed(2));
  // System load between 22% and 36%
  const systemLoadPercent = 22 + (seed % 15);

  return {
    responseTimeMs,
    requestRateRps,
    errorRatePercent,
    systemLoadPercent
  };
}

export function generateInitialChartHistory(baseline: MetricSnapshot): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const baseTime = 0;
  for (let i = 0; i < 8; i++) {
    const sec = i * 2;
    // Tiny deterministic variance (+/- 3ms) for realism
    const variance = ((i * 7) % 7) - 3;
    points.push({
      timeOffsetSec: sec,
      timeLabel: `00:${sec < 10 ? '0' : ''}${sec}s`,
      responseTimeMs: baseline.responseTimeMs + variance,
      thresholdMs: BOTTLENECK_THRESHOLD_MS,
      requestRateRps: baseline.requestRateRps
    });
  }
  return points;
}

export function createInitialStateForWebsite(hostname: string): WebsiteSimulationState {
  const baseline = generateBaselineForHostname(hostname);
  const chartHistory = generateInitialChartHistory(baseline);

  const initialEvent: SimulationEvent = {
    id: `evt-${Date.now()}-1`,
    timestampSec: 0,
    timeLabel: '00:00s',
    category: 'baseline',
    title: 'Baseline Established',
    description: `Stable synthetic baseline recorded for ${hostname} at ~${baseline.responseTimeMs}ms response time, ${baseline.requestRateRps} rps load.`,
    severity: 'info'
  };

  return {
    baseline,
    currentMetrics: { ...baseline },
    activeScenario: null,
    phase: 'idle',
    optimizationStatus: 'IDLE',
    statusExplanation: 'Simulation engine is in standby. Select a scenario below to run a controlled performance simulation.',
    isRunning: false,
    isAutoStepping: false,
    waitingForUserMitigation: false,
    proposedAction: null,
    chartHistory,
    eventHistory: [initialEvent],
    comparisonResult: null
  };
}

export function startScenario(
  state: WebsiteSimulationState,
  scenario: ScenarioType
): WebsiteSimulationState {
  const nextTimeSec = state.chartHistory[state.chartHistory.length - 1].timeOffsetSec + 2;
  const timeStr = `00:${nextTimeSec < 10 ? '0' : ''}${nextTimeSec}s`;

  let eventTitle = '';
  let eventDesc = '';

  if (scenario === 'traffic_spike') {
    eventTitle = 'Scenario Initiated: Traffic Spike';
    eventDesc = 'Simulating an abrupt incoming concurrency burst across regional client edges.';
  } else if (scenario === 'database_pressure') {
    eventTitle = 'Scenario Initiated: Database Pressure';
    eventDesc = 'Modeling relational connection queue backlog and query contention delays.';
  } else {
    eventTitle = 'Scenario Initiated: Recovery & Rollback';
    eventDesc = 'Evaluating closed-loop policy restoration when synthetic load recedes.';
  }

  const startEvent: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestampSec: nextTimeSec,
    timeLabel: timeStr,
    category: 'telemetry',
    title: eventTitle,
    description: eventDesc,
    severity: 'info'
  };

  return {
    ...state,
    activeScenario: scenario,
    phase: 'stress',
    optimizationStatus: 'MONITORING SIMULATION',
    statusExplanation: `Monitoring observable metrics during modeled ${scenario.replace('_', ' ')}. Telemetry within initial acceptable boundaries.`,
    isRunning: true,
    waitingForUserMitigation: false,
    proposedAction: null,
    comparisonResult: null,
    eventHistory: [startEvent, ...state.eventHistory]
  };
}

export function advanceSimulationStep(
  state: WebsiteSimulationState
): WebsiteSimulationState {
  if (!state.activeScenario || !state.isRunning) return state;

  const lastPoint = state.chartHistory[state.chartHistory.length - 1];
  const nextTimeSec = lastPoint.timeOffsetSec + 2;
  const timeStr = `00:${nextTimeSec < 10 ? '0' : ''}${nextTimeSec}s`;

  // === SCENARIO 1: TRAFFIC SPIKE ===
  if (state.activeScenario === 'traffic_spike') {
    if (state.phase === 'stress') {
      // Step to peak stress & bottleneck
      const peakReqRate = Math.round(state.baseline.requestRateRps * 4.8);
      const peakLatency = Math.round(state.baseline.responseTimeMs * 2.3 + 45);
      const peakError = Number((state.baseline.errorRatePercent + 2.85).toFixed(2));
      const peakLoad = Math.min(94, state.baseline.systemLoadPercent + 58);

      const newMetrics: MetricSnapshot = {
        responseTimeMs: peakLatency,
        requestRateRps: peakReqRate,
        errorRatePercent: peakError,
        systemLoadPercent: peakLoad
      };

      const bottleneckEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'bottleneck',
        title: 'Bottleneck Detected: Concurrency Surge',
        description: `Simulated latency jumped to ${peakLatency}ms (threshold ${BOTTLENECK_THRESHOLD_MS}ms) with ${peakReqRate} req/s concurrent traffic.`,
        severity: 'alert'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: peakLatency,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: peakReqRate
      };

      return {
        ...state,
        phase: 'mitigation_proposed',
        optimizationStatus: 'BOTTLENECK DETECTED',
        statusExplanation: `Latency (${peakLatency}ms) exceeded safety threshold (${BOTTLENECK_THRESHOLD_MS}ms) due to concurrent request surge. System recommends mitigation.`,
        currentMetrics: newMetrics,
        waitingForUserMitigation: true,
        proposedAction: {
          title: 'Dynamic Edge Cache Policy',
          description: 'Adjust Cache-Control headers and activate edge micro-caching for static and idempotent endpoints to offload origin compute.',
          actionLabel: 'Apply Simulated Edge Cache',
          expectedImpact: 'Estimated 60-70% latency reduction by serving cached responses from edge POPs.'
        },
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [bottleneckEvent, ...state.eventHistory]
      };
    }

    if (state.phase === 'mitigation_active') {
      // Step to recovery
      const recLatency = Math.round(state.baseline.responseTimeMs * 0.92);
      const recReqRate = state.currentMetrics.requestRateRps; // rate is still high, but cache is absorbing
      const recError = Number((state.baseline.errorRatePercent * 0.8).toFixed(2));
      const recLoad = Math.round(state.baseline.systemLoadPercent * 1.1);

      const recoveredMetrics: MetricSnapshot = {
        responseTimeMs: recLatency,
        requestRateRps: recReqRate,
        errorRatePercent: recError,
        systemLoadPercent: recLoad
      };

      const recoveryEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'recovery',
        title: 'Recovery Verified: Edge Cache Absorbing Surge',
        description: `Latency resolved down to ${recLatency}ms under continued ${recReqRate} rps load. Edge cache hit ratio stabilized at 88.4%.`,
        severity: 'success'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: recLatency,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: recReqRate
      };

      // Calculate before and after
      const peakLat = Math.max(...state.chartHistory.map(p => p.responseTimeMs));
      const deltaMs = peakLat - recLatency;
      const deltaPercent = Number(((deltaMs / peakLat) * 100).toFixed(1));

      const comparison: ScenarioComparison = {
        baselineLatencyMs: state.baseline.responseTimeMs,
        peakLatencyMs: peakLat,
        postMitigationLatencyMs: recLatency,
        peakRequestRateRps: recReqRate,
        errorRateBeforePercent: state.currentMetrics.errorRatePercent,
        errorRateAfterPercent: recError,
        calculatedLatencyDeltaMs: deltaMs,
        calculatedLatencyDeltaPercent: deltaPercent
      };

      return {
        ...state,
        phase: 'completed',
        optimizationStatus: 'RECOVERY VERIFIED',
        statusExplanation: `Simulated mitigation successful. Latency safely recovered from ${peakLat}ms peak to ${recLatency}ms with zero server configuration modified.`,
        currentMetrics: recoveredMetrics,
        isRunning: false,
        isAutoStepping: false,
        waitingForUserMitigation: false,
        proposedAction: null,
        comparisonResult: comparison,
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [recoveryEvent, ...state.eventHistory]
      };
    }
  }

  // === SCENARIO 2: DATABASE PRESSURE ===
  if (state.activeScenario === 'database_pressure') {
    if (state.phase === 'stress') {
      const dbLatency = Math.round(state.baseline.responseTimeMs * 2.8 + 60);
      const dbReqRate = Math.round(state.baseline.requestRateRps * 1.6);
      const dbError = Number((state.baseline.errorRatePercent + 3.4).toFixed(2));
      const dbLoad = 92;

      const newMetrics: MetricSnapshot = {
        responseTimeMs: dbLatency,
        requestRateRps: dbReqRate,
        errorRatePercent: dbError,
        systemLoadPercent: dbLoad
      };

      const dbBottleneckEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'bottleneck',
        title: 'Bottleneck Detected: Database Query Contention',
        description: `Simulated database connection queue saturated (92% pool exhaustion). Response time climbed to ${dbLatency}ms.`,
        severity: 'alert'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: dbLatency,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: dbReqRate
      };

      return {
        ...state,
        phase: 'mitigation_proposed',
        optimizationStatus: 'BOTTLENECK DETECTED',
        statusExplanation: `Modeled internal database connection pool exhausted. Latency (${dbLatency}ms) severely exceeds safe operating bounds.`,
        currentMetrics: newMetrics,
        waitingForUserMitigation: true,
        proposedAction: {
          title: 'Read-Path Query Buffer',
          description: 'Simulate short-lived in-memory caching for read-heavy SQL query patterns to alleviate database connection pool contention.',
          actionLabel: 'Enable Query Result Buffer',
          expectedImpact: 'Relieves database worker thread backlog and shields downstream connection pools.'
        },
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [dbBottleneckEvent, ...state.eventHistory]
      };
    }

    if (state.phase === 'mitigation_active') {
      const recLatency = Math.round(state.baseline.responseTimeMs * 1.05);
      const recReqRate = state.currentMetrics.requestRateRps;
      const recError = state.baseline.errorRatePercent;
      const recLoad = Math.round(state.baseline.systemLoadPercent * 1.2);

      const recoveredMetrics: MetricSnapshot = {
        responseTimeMs: recLatency,
        requestRateRps: recReqRate,
        errorRatePercent: recError,
        systemLoadPercent: recLoad
      };

      const recoveryEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'recovery',
        title: 'Recovery Verified: Query Backlog Cleared',
        description: `Read buffer intercepted 74% of contentious queries. Backend latency returned to nominal ${recLatency}ms.`,
        severity: 'success'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: recLatency,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: recReqRate
      };

      const peakLat = Math.max(...state.chartHistory.map(p => p.responseTimeMs));
      const deltaMs = peakLat - recLatency;
      const deltaPercent = Number(((deltaMs / peakLat) * 100).toFixed(1));

      const comparison: ScenarioComparison = {
        baselineLatencyMs: state.baseline.responseTimeMs,
        peakLatencyMs: peakLat,
        postMitigationLatencyMs: recLatency,
        peakRequestRateRps: recReqRate,
        errorRateBeforePercent: state.currentMetrics.errorRatePercent,
        errorRateAfterPercent: recError,
        calculatedLatencyDeltaMs: deltaMs,
        calculatedLatencyDeltaPercent: deltaPercent
      };

      return {
        ...state,
        phase: 'completed',
        optimizationStatus: 'RECOVERY VERIFIED',
        statusExplanation: `Database contention simulation resolved. Simulated query buffer restored stable latency to ${recLatency}ms.`,
        currentMetrics: recoveredMetrics,
        isRunning: false,
        isAutoStepping: false,
        waitingForUserMitigation: false,
        proposedAction: null,
        comparisonResult: comparison,
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [recoveryEvent, ...state.eventHistory]
      };
    }
  }

  // === SCENARIO 3: RECOVERY & ROLLBACK ===
  if (state.activeScenario === 'recovery_rollback') {
    if (state.phase === 'stress') {
      const distLatency = Math.round(state.baseline.responseTimeMs * 1.9 + 20);
      const distReqRate = Math.round(state.baseline.requestRateRps * 2.1);
      const distError = Number((state.baseline.errorRatePercent + 1.2).toFixed(2));
      const distLoad = 68;

      const newMetrics: MetricSnapshot = {
        responseTimeMs: distLatency,
        requestRateRps: distReqRate,
        errorRatePercent: distError,
        systemLoadPercent: distLoad
      };

      const distEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'bottleneck',
        title: 'Performance Disturbance Applied',
        description: `Simulated transient latency elevation (${distLatency}ms). Preparing automated mitigation policy evaluation.`,
        severity: 'warning'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: distLatency,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: distReqRate
      };

      return {
        ...state,
        phase: 'mitigation_proposed',
        optimizationStatus: 'BOTTLENECK DETECTED',
        statusExplanation: `Transient disturbance active. Temporary aggressive TTL policy staged for automatic execution.`,
        currentMetrics: newMetrics,
        waitingForUserMitigation: true,
        proposedAction: {
          title: 'Temporary Aggressive TTL Mitigation',
          description: 'Deploy aggressive 10-minute TTL override during peak disturbance to evaluate automated closed-loop rollback upon recedence.',
          actionLabel: 'Engage Temporary Policy',
          expectedImpact: 'Isolates disturbance, followed by automatic baseline restoration once load normalizes.'
        },
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [distEvent, ...state.eventHistory]
      };
    }

    if (state.phase === 'mitigation_active') {
      // First, simulate load subsiding and condition evaluation
      const normalizedMetrics: MetricSnapshot = {
        responseTimeMs: state.baseline.responseTimeMs,
        requestRateRps: state.baseline.requestRateRps,
        errorRatePercent: state.baseline.errorRatePercent,
        systemLoadPercent: state.baseline.systemLoadPercent
      };

      const rollbackEvent: SimulationEvent = {
        id: `evt-${Date.now()}`,
        timestampSec: nextTimeSec,
        timeLabel: timeStr,
        category: 'recovery',
        title: 'Recovery Verified & Configuration Restored',
        description: `Traffic receded below threshold. Automatic rollback executed: restored standard baseline Cache-Control policies safely.`,
        severity: 'success'
      };

      const newPoint: ChartDataPoint = {
        timeOffsetSec: nextTimeSec,
        timeLabel: timeStr,
        responseTimeMs: state.baseline.responseTimeMs,
        thresholdMs: BOTTLENECK_THRESHOLD_MS,
        requestRateRps: state.baseline.requestRateRps
      };

      const peakLat = Math.max(...state.chartHistory.map(p => p.responseTimeMs));
      const deltaMs = peakLat - state.baseline.responseTimeMs;
      const deltaPercent = Number(((deltaMs / peakLat) * 100).toFixed(1));

      const comparison: ScenarioComparison = {
        baselineLatencyMs: state.baseline.responseTimeMs,
        peakLatencyMs: peakLat,
        postMitigationLatencyMs: state.baseline.responseTimeMs,
        peakRequestRateRps: state.currentMetrics.requestRateRps,
        errorRateBeforePercent: state.currentMetrics.errorRatePercent,
        errorRateAfterPercent: state.baseline.errorRatePercent,
        calculatedLatencyDeltaMs: deltaMs,
        calculatedLatencyDeltaPercent: deltaPercent
      };

      return {
        ...state,
        phase: 'completed',
        optimizationStatus: 'RECOVERY VERIFIED',
        statusExplanation: `Recovery criteria satisfied. Simulated configuration automatically rolled back to standard baseline.`,
        currentMetrics: normalizedMetrics,
        isRunning: false,
        isAutoStepping: false,
        waitingForUserMitigation: false,
        proposedAction: null,
        comparisonResult: comparison,
        chartHistory: [...state.chartHistory.slice(-15), newPoint],
        eventHistory: [rollbackEvent, ...state.eventHistory]
      };
    }
  }

  return state;
}

export function triggerUserMitigation(
  state: WebsiteSimulationState
): WebsiteSimulationState {
  if (!state.proposedAction) return state;

  const nextTimeSec = state.chartHistory[state.chartHistory.length - 1].timeOffsetSec + 2;
  const timeStr = `00:${nextTimeSec < 10 ? '0' : ''}${nextTimeSec}s`;

  const mitigationEvent: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestampSec: nextTimeSec,
    timeLabel: timeStr,
    category: 'mitigation',
    title: `Mitigation Applied: ${state.proposedAction.title}`,
    description: `${state.proposedAction.description} (Simulated bounded frontend transition).`,
    severity: 'info'
  };

  return {
    ...state,
    phase: 'mitigation_active',
    optimizationStatus: 'MITIGATION SIMULATED',
    statusExplanation: `Mitigation "${state.proposedAction.title}" simulated. Observing metric recovery response.`,
    waitingForUserMitigation: false,
    eventHistory: [mitigationEvent, ...state.eventHistory]
  };
}

export function resetScenarioToBaseline(
  state: WebsiteSimulationState
): WebsiteSimulationState {
  const nextTimeSec = state.chartHistory[state.chartHistory.length - 1].timeOffsetSec + 2;
  const timeStr = `00:${nextTimeSec < 10 ? '0' : ''}${nextTimeSec}s`;

  const resetEvent: SimulationEvent = {
    id: `evt-${Date.now()}`,
    timestampSec: nextTimeSec,
    timeLabel: timeStr,
    category: 'system',
    title: 'Simulation Reset to Baseline',
    description: `All simulated variables restored to nominal baseline values (${state.baseline.responseTimeMs}ms, ${state.baseline.requestRateRps} rps).`,
    severity: 'info'
  };

  const newPoint: ChartDataPoint = {
    timeOffsetSec: nextTimeSec,
    timeLabel: timeStr,
    responseTimeMs: state.baseline.responseTimeMs,
    thresholdMs: BOTTLENECK_THRESHOLD_MS,
    requestRateRps: state.baseline.requestRateRps
  };

  return {
    ...state,
    currentMetrics: { ...state.baseline },
    activeScenario: null,
    phase: 'idle',
    optimizationStatus: 'IDLE',
    statusExplanation: 'Simulation engine is in standby. Select a scenario below to run a controlled performance simulation.',
    isRunning: false,
    isAutoStepping: false,
    waitingForUserMitigation: false,
    proposedAction: null,
    comparisonResult: null,
    chartHistory: [...state.chartHistory.slice(-15), newPoint],
    eventHistory: [resetEvent, ...state.eventHistory]
  };
}
