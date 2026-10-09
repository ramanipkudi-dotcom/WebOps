export type ScenarioType = 'traffic_spike' | 'database_pressure' | 'recovery_rollback';

export type OptimizationStatus = 
  | 'IDLE' 
  | 'MONITORING SIMULATION' 
  | 'BOTTLENECK DETECTED' 
  | 'MITIGATION SIMULATED' 
  | 'RECOVERY VERIFIED';

export type SimulationPhase =
  | 'idle'
  | 'baseline'
  | 'stress'
  | 'bottleneck'
  | 'mitigation_proposed'
  | 'mitigation_active'
  | 'recovery'
  | 'completed';

export interface MetricSnapshot {
  responseTimeMs: number;
  requestRateRps: number;
  errorRatePercent: number;
  systemLoadPercent: number;
}

export interface ChartDataPoint {
  timeOffsetSec: number;
  timeLabel: string;
  responseTimeMs: number;
  thresholdMs: number;
  requestRateRps: number;
}

export interface SimulationEvent {
  id: string;
  timestampSec: number;
  timeLabel: string;
  category: 'baseline' | 'telemetry' | 'bottleneck' | 'mitigation' | 'recovery' | 'system';
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'alert' | 'success';
}

export interface ScenarioComparison {
  baselineLatencyMs: number;
  peakLatencyMs: number;
  postMitigationLatencyMs: number;
  peakRequestRateRps: number;
  errorRateBeforePercent: number;
  errorRateAfterPercent: number;
  calculatedLatencyDeltaMs: number;
  calculatedLatencyDeltaPercent: number;
}

export interface WebsiteSimulationState {
  baseline: MetricSnapshot;
  currentMetrics: MetricSnapshot;
  activeScenario: ScenarioType | null;
  phase: SimulationPhase;
  optimizationStatus: OptimizationStatus;
  statusExplanation: string;
  isRunning: boolean;
  isAutoStepping: boolean;
  waitingForUserMitigation: boolean;
  proposedAction: {
    title: string;
    description: string;
    actionLabel: string;
    expectedImpact: string;
  } | null;
  chartHistory: ChartDataPoint[];
  eventHistory: SimulationEvent[];
  comparisonResult: ScenarioComparison | null;
}

export interface RegisteredWebsite {
  id: string;
  url: string;
  hostname: string;
  registeredAt: number;
  simulationState: WebsiteSimulationState;
}
