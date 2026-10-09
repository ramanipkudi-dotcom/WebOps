import React, { useState, useEffect, useRef } from 'react';
import { DayosLogo } from './DayosLogo';
import { HoverLoop } from './HoverLoop';
import { PerformanceChart } from './PerformanceChart';
import {
  RegisteredWebsite,
  ScenarioType,
  WebsiteSimulationState
} from '../types/simulation';
import {
  BOTTLENECK_THRESHOLD_MS,
  startScenario,
  advanceSimulationStep,
  triggerUserMitigation,
  resetScenarioToBaseline
} from '../utils/simulationEngine';

interface DashboardProps {
  websites: RegisteredWebsite[];
  activeWebsiteId: string;
  onSelectWebsite: (id: string) => void;
  onAddNewWebsite: () => void;
  onBackToOverview: () => void;
  onUpdateWebsiteState: (id: string, newState: WebsiteSimulationState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  websites,
  activeWebsiteId,
  onSelectWebsite,
  onAddNewWebsite,
  onBackToOverview,
  onUpdateWebsiteState
}) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('traffic_spike');
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const activeWebsite = websites.find(w => w.id === activeWebsiteId) || websites[0];
  const simState = activeWebsite?.simulationState;

  // Auto-play timer for active scenarios
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }

    if (simState && simState.isRunning && autoPlay && !simState.waitingForUserMitigation && simState.phase !== 'completed') {
      autoPlayRef.current = setInterval(() => {
        if (!activeWebsite) return;
        const nextState = advanceSimulationStep(activeWebsite.simulationState);
        onUpdateWebsiteState(activeWebsite.id, nextState);
      }, 2400);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [simState?.isRunning, simState?.phase, simState?.waitingForUserMitigation, autoPlay, activeWebsite?.id]);

  if (!activeWebsite || !simState) {
    return (
      <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[8px] border border-[#dcdcdc] text-center max-w-md">
          <h2 className="font-cond text-2xl uppercase mb-3">No Active Website Found</h2>
          <p className="text-sm font-body text-[#555555] mb-6">
            Please register a website URL to open the performance workspace.
          </p>
          <button
            onClick={onAddNewWebsite}
            className="bg-black text-white px-5 py-2.5 rounded-[4px] font-body text-sm font-medium"
          >
            Add Website
          </button>
        </div>
      </div>
    );
  }

  // Handlers
  const handleStartSimulation = () => {
    const updated = startScenario(simState, selectedScenario);
    onUpdateWebsiteState(activeWebsite.id, updated);
  };

  const handleNextStep = () => {
    const updated = advanceSimulationStep(simState);
    onUpdateWebsiteState(activeWebsite.id, updated);
  };

  const handleApplyMitigation = () => {
    const updated = triggerUserMitigation(simState);
    onUpdateWebsiteState(activeWebsite.id, updated);
  };

  const handleReset = () => {
    const updated = resetScenarioToBaseline(simState);
    onUpdateWebsiteState(activeWebsite.id, updated);
  };

  // Status Badge Styling (Restrained, intentional)
  const getStatusBadge = () => {
    switch (simState.optimizationStatus) {
      case 'BOTTLENECK DETECTED':
        return {
          bg: 'bg-[#fff100] text-black border-[#d4c600]',
          label: 'BOTTLENECK DETECTED'
        };
      case 'MITIGATION SIMULATED':
        return {
          bg: 'bg-[#d1ffca] text-black border-[#a8e69f]',
          label: 'MITIGATION ACTIVE'
        };
      case 'RECOVERY VERIFIED':
        return {
          bg: 'bg-[#d1ffca] text-black border-[#a8e69f]',
          label: 'RECOVERY VERIFIED'
        };
      case 'MONITORING SIMULATION':
        return {
          bg: 'bg-[#f0f0f0] text-black border-[#cccccc]',
          label: 'MONITORING SIMULATION'
        };
      case 'IDLE':
      default:
        return {
          bg: 'bg-[#f5f5f5] text-[#555555] border-[#e0e0e0]',
          label: 'IDLE'
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col justify-between selection:bg-[#d1ffca] selection:text-[#000000]">
      {/* 1. Technical Header */}
      <header className="sticky top-0 z-40 bg-[#e5e5e5]/95 backdrop-blur-xs px-6 md:px-10 py-3.5 border-b border-[#d8d8d8]">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Context */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackToOverview}
              className="flex items-center cursor-pointer focus:outline-none"
              aria-label="WebOps Homepage"
            >
              <DayosLogo className="h-6 md:h-7 w-auto" theme="black" />
            </button>

            <span className="text-[#bbbbbb] font-mono text-sm select-none">/</span>

            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#555555]">
              Performance Workspace
            </span>
          </div>

          {/* Right: Target Selector & Navigation */}
          <div className="flex items-center gap-3">
            {/* Target Website Selector */}
            <div className="relative">
              <button
                onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
                className="bg-white border border-[#d2d2d2] hover:border-black rounded-[4px] px-3 py-1.5 flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer"
                aria-expanded={websiteDropdownOpen}
              >
                <span className="text-[#888888] hidden sm:inline">Target:</span>
                <span className="font-semibold text-black max-w-[150px] sm:max-w-[200px] truncate">
                  {activeWebsite.hostname}
                </span>
                <span className="text-[9px] text-[#666666]">▼</span>
              </button>

              {websiteDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-[6px] shadow-sm border border-[#d2d2d2] p-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-[#888888] uppercase border-b border-[#f0f0f0]">
                    Registered Targets ({websites.length})
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {websites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => {
                          onSelectWebsite(site.id);
                          setWebsiteDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-[4px] text-xs font-mono flex items-center justify-between transition-colors ${
                          site.id === activeWebsite.id
                            ? 'bg-[#f3f3f3] text-black font-semibold'
                            : 'text-[#444444] hover:bg-[#fafafa]'
                        }`}
                      >
                        <span className="truncate pr-2">{site.hostname}</span>
                        {site.id === activeWebsite.id && (
                          <span className="text-black text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 border-t border-[#f0f0f0]">
                    <button
                      onClick={() => {
                        setWebsiteDropdownOpen(false);
                        onAddNewWebsite();
                      }}
                      className="w-full bg-[#f8f8f8] hover:bg-black hover:text-white text-black font-body text-xs font-medium py-2 rounded-[4px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>+</span>
                      <span>Add Website</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Back to Homepage */}
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 bg-white text-[#444444] hover:text-black px-3 py-1.5 rounded-[4px] font-body text-xs font-medium border border-[#d2d2d2] transition-colors cursor-pointer"
            >
              <span>←</span>
              <span>Overview</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Body */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 md:px-10 py-7 md:py-9">
        {/* Page Heading & Technical Notice */}
        <div className="mb-7 pb-6 border-b border-[#d8d8d8] flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-cond text-[36px] sm:text-[44px] md:text-[50px] font-[700] uppercase tracking-[-0.03em] leading-none text-black">
              Performance Overview
            </h1>
            <p className="font-body text-xs md:text-sm text-[#555555] mt-2 max-w-[700px]">
              Target: <span className="font-mono text-black font-medium">{activeWebsite.url}</span>. Simulated demonstration environment. No network requests or configuration changes are dispatched to target infrastructure.
            </p>
          </div>

          <div className="font-mono text-[11px] text-[#777777] shrink-0">
            Session Baseline: <span className="text-black font-semibold">{simState.baseline.responseTimeMs} ms</span>
          </div>
        </div>

        {/* 3. Summary Metric Grid (4 Aligned Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
          {/* Metric 1: Response Time */}
          <div className="bg-white rounded-[8px] p-5 border border-[#dcdcdc] flex flex-col justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-[#666666] mb-2">
              Response Time
            </div>
            <div className="font-cond text-[38px] md:text-[44px] font-[700] leading-none text-black tracking-tight my-1">
              {simState.currentMetrics.responseTimeMs}
              <span className="font-body text-xs font-normal text-[#666666] ml-1">ms</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#777777]">Baseline: {simState.baseline.responseTimeMs} ms</span>
              <span className={simState.currentMetrics.responseTimeMs > BOTTLENECK_THRESHOLD_MS ? 'text-[#dc2626] font-semibold' : 'text-[#555555]'}>
                {simState.currentMetrics.responseTimeMs > BOTTLENECK_THRESHOLD_MS ? 'Elevated' : 'Nominal'}
              </span>
            </div>
          </div>

          {/* Metric 2: Request Rate */}
          <div className="bg-white rounded-[8px] p-5 border border-[#dcdcdc] flex flex-col justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-[#666666] mb-2">
              Request Rate
            </div>
            <div className="font-cond text-[38px] md:text-[44px] font-[700] leading-none text-black tracking-tight my-1">
              {simState.currentMetrics.requestRateRps}
              <span className="font-body text-xs font-normal text-[#666666] ml-1">req/s</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#777777]">Baseline: {simState.baseline.requestRateRps} rps</span>
              <span className="text-[#555555]">
                {simState.currentMetrics.requestRateRps > simState.baseline.requestRateRps * 2 ? 'Surge Load' : 'Standard'}
              </span>
            </div>
          </div>

          {/* Metric 3: Error Rate */}
          <div className="bg-white rounded-[8px] p-5 border border-[#dcdcdc] flex flex-col justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-[#666666] mb-2">
              Error Rate
            </div>
            <div className="font-cond text-[38px] md:text-[44px] font-[700] leading-none text-black tracking-tight my-1">
              {simState.currentMetrics.errorRatePercent}
              <span className="font-body text-xs font-normal text-[#666666] ml-1">%</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#777777]">Baseline: {simState.baseline.errorRatePercent}%</span>
              <span className={simState.currentMetrics.errorRatePercent > 1.5 ? 'text-[#dc2626] font-semibold' : 'text-[#555555]'}>
                {simState.currentMetrics.errorRatePercent > 1.5 ? 'Degraded' : 'Nominal'}
              </span>
            </div>
          </div>

          {/* Metric 4: System Load */}
          <div className="bg-white rounded-[8px] p-5 border border-[#dcdcdc] flex flex-col justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-[#666666] mb-2">
              System Load
            </div>
            <div className="font-cond text-[38px] md:text-[44px] font-[700] leading-none text-black tracking-tight my-1">
              {simState.currentMetrics.systemLoadPercent}
              <span className="font-body text-xs font-normal text-[#666666] ml-1">%</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#777777]">Baseline: {simState.baseline.systemLoadPercent}%</span>
              <span className={simState.currentMetrics.systemLoadPercent > 70 ? 'text-[#dc2626] font-semibold' : 'text-[#555555]'}>
                {simState.currentMetrics.systemLoadPercent > 70 ? 'High Pressure' : 'Nominal'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Chart & Workflow Progression (Balanced 8/4 Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-7">
          {/* Chart (8 cols) */}
          <div className="lg:col-span-8">
            <PerformanceChart
              data={simState.chartHistory}
              thresholdMs={BOTTLENECK_THRESHOLD_MS}
            />
          </div>

          {/* Engine State & Controls Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-[8px] p-5 border border-[#dcdcdc]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0f0f0]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#666666]">
                  Engine State
                </span>
                <span className={`px-2 py-0.5 rounded-[3px] font-mono text-[11px] font-semibold border ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
              </div>

              <p className="font-body text-xs text-[#444444] leading-relaxed mb-4">
                {simState.statusExplanation}
              </p>

              {/* Proposed Action Box (High-contrast, restrained) */}
              {simState.proposedAction && (
                <div className="bg-[#fafafa] border border-black rounded-[6px] p-4 mb-4">
                  <div className="font-mono text-[10px] text-[#666666] uppercase mb-1">
                    Mitigation Policy Available
                  </div>
                  <div className="font-cond text-base font-bold uppercase text-black mb-1">
                    {simState.proposedAction.title}
                  </div>
                  <p className="font-body text-xs text-[#555555] mb-2 leading-normal">
                    {simState.proposedAction.description}
                  </p>
                  <div className="text-[11px] font-mono text-[#777777] mb-3">
                    Expected: {simState.proposedAction.expectedImpact}
                  </div>
                  <button
                    onClick={handleApplyMitigation}
                    className="w-full bg-black text-white hover:bg-[#222222] py-2 px-3 rounded-[4px] font-body text-xs font-medium transition-colors cursor-pointer"
                  >
                    {simState.proposedAction.actionLabel} →
                  </button>
                </div>
              )}
            </div>

            {/* Workflow progression indicator */}
            <div className="pt-3 border-t border-[#f0f0f0]">
              <div className="text-[10px] font-mono text-[#888888] uppercase mb-2">
                Demonstration Workflow
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                <div className={`py-1 rounded-[3px] border ${
                  simState.phase === 'baseline' || simState.phase === 'idle'
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-[#fafafa] text-[#666666] border-[#e8e8e8]'
                }`}>
                  1. Observe
                </div>
                <div className={`py-1 rounded-[3px] border ${
                  simState.phase === 'stress' || simState.phase === 'mitigation_proposed'
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-[#fafafa] text-[#666666] border-[#e8e8e8]'
                }`}>
                  2. Predict
                </div>
                <div className={`py-1 rounded-[3px] border ${
                  simState.phase === 'mitigation_active'
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-[#fafafa] text-[#666666] border-[#e8e8e8]'
                }`}>
                  3. Mitigate
                </div>
                <div className={`py-1 rounded-[3px] border ${
                  simState.phase === 'completed'
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-[#fafafa] text-[#666666] border-[#e8e8e8]'
                }`}>
                  4. Recover
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Scenario Controls: "RUN A SCENARIO" */}
        <div className="bg-white rounded-[8px] p-5 md:p-6 border border-[#dcdcdc] mb-7">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 mb-4 border-b border-[#f0f0f0]">
            <div>
              <h2 className="font-cond text-2xl md:text-3xl font-[700] uppercase tracking-[-0.02em] text-black">
                Run a Scenario
              </h2>
              <p className="font-body text-xs text-[#666666] mt-0.5">
                Select a deterministic scenario to model workload behavior and policy evaluation.
              </p>
            </div>

            {/* Stepper & Reset Controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-mono text-[#555555] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={e => setAutoPlay(e.target.checked)}
                  className="rounded border-[#cccccc] accent-black"
                />
                <span>Auto-Step</span>
              </label>

              {simState.isRunning && (
                <button
                  onClick={handleNextStep}
                  disabled={simState.waitingForUserMitigation}
                  className="bg-[#f0f0f0] hover:bg-black hover:text-white text-black px-2.5 py-1 rounded-[4px] font-body text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Step Next
                </button>
              )}

              <button
                onClick={handleReset}
                className="border border-[#cccccc] hover:border-black text-black px-2.5 py-1 rounded-[4px] font-body text-xs font-medium transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Scenario Selection Grid (3 Restrained Panels) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {/* Scenario 1: Traffic Spike */}
            <div
              onClick={() => !simState.isRunning && setSelectedScenario('traffic_spike')}
              className={`p-4 rounded-[6px] border transition-colors cursor-pointer ${
                selectedScenario === 'traffic_spike'
                  ? 'border-black bg-[#fafafa]'
                  : 'border-[#e0e0e0] bg-white hover:border-[#b0b0b0]'
              } ${simState.isRunning && simState.activeScenario !== 'traffic_spike' ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="font-mono text-[10px] text-[#777777] uppercase font-semibold mb-1">
                01 / Concurrency
              </div>
              <h3 className="font-cond text-xl font-[700] uppercase text-black mb-1">
                Traffic Spike
              </h3>
              <p className="font-body text-xs text-[#555555] leading-relaxed">
                Simulates an abrupt increase in incoming HTTP requests to evaluate latency and error degradation.
              </p>
            </div>

            {/* Scenario 2: Database Pressure */}
            <div
              onClick={() => !simState.isRunning && setSelectedScenario('database_pressure')}
              className={`p-4 rounded-[6px] border transition-colors cursor-pointer ${
                selectedScenario === 'database_pressure'
                  ? 'border-black bg-[#fafafa]'
                  : 'border-[#e0e0e0] bg-white hover:border-[#b0b0b0]'
              } ${simState.isRunning && simState.activeScenario !== 'database_pressure' ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="font-mono text-[10px] text-[#777777] uppercase font-semibold mb-1">
                02 / Database
              </div>
              <h3 className="font-cond text-xl font-[700] uppercase text-black mb-1">
                Database Pressure
              </h3>
              <p className="font-body text-xs text-[#555555] leading-relaxed">
                Models connection pool saturation and read-query contention delays on application response time.
              </p>
            </div>

            {/* Scenario 3: Recovery & Rollback */}
            <div
              onClick={() => !simState.isRunning && setSelectedScenario('recovery_rollback')}
              className={`p-4 rounded-[6px] border transition-colors cursor-pointer ${
                selectedScenario === 'recovery_rollback'
                  ? 'border-black bg-[#fafafa]'
                  : 'border-[#e0e0e0] bg-white hover:border-[#b0b0b0]'
              } ${simState.isRunning && simState.activeScenario !== 'recovery_rollback' ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="font-mono text-[10px] text-[#777777] uppercase font-semibold mb-1">
                03 / Equilibrium
              </div>
              <h3 className="font-cond text-xl font-[700] uppercase text-black mb-1">
                Recovery &amp; Rollback
              </h3>
              <p className="font-body text-xs text-[#555555] leading-relaxed">
                Evaluates automated policy restoration once synthetic traffic recedes back within safe operating bounds.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {!simState.isRunning ? (
              <button
                onClick={handleStartSimulation}
                className="bg-black text-white hover:bg-[#222222] px-6 py-2.5 rounded-[4px] font-body text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <HoverLoop>Start Simulation</HoverLoop>
                <span>▶</span>
              </button>
            ) : simState.waitingForUserMitigation ? (
              <button
                onClick={handleApplyMitigation}
                className="bg-black text-white hover:bg-[#222222] px-6 py-2.5 rounded-[4px] font-body text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply Mitigation: {simState.proposedAction?.actionLabel}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#666666]">Simulation in progress</span>
                <button
                  onClick={handleNextStep}
                  className="bg-black text-white px-4 py-1.5 rounded-[4px] font-body text-xs font-medium cursor-pointer"
                >
                  Step Forward
                </button>
              </div>
            )}

            <div className="font-mono text-xs text-[#777777]">
              Active target: <span className="text-black font-semibold">{activeWebsite.hostname}</span>
            </div>
          </div>
        </div>

        {/* 6. Simulation Result Comparison Panel (When scenario completed) */}
        {simState.comparisonResult && (
          <div className="bg-white rounded-[8px] p-5 md:p-6 border border-[#dcdcdc] mb-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#f0f0f0] gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                  Simulation Outcome
                </span>
                <span className="text-[#888888] font-mono text-xs">/</span>
                <span className="font-mono text-xs text-[#666666]">
                  {activeWebsite.hostname}
                </span>
              </div>
              <span className="font-mono text-xs text-[#333333]">
                Simulated recovery criteria met; latency returned to baseline range.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Baseline
                </div>
                <div className="font-cond text-2xl font-bold text-black">
                  {simState.comparisonResult.baselineLatencyMs} ms
                </div>
              </div>

              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Peak Latency
                </div>
                <div className="font-cond text-2xl font-bold text-black">
                  {simState.comparisonResult.peakLatencyMs} ms
                </div>
              </div>

              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Post-Mitigation
                </div>
                <div className="font-cond text-2xl font-bold text-black">
                  {simState.comparisonResult.postMitigationLatencyMs} ms
                </div>
              </div>

              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Peak Rate
                </div>
                <div className="font-cond text-2xl font-bold text-black">
                  {simState.comparisonResult.peakRequestRateRps} rps
                </div>
              </div>

              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Error Transition
                </div>
                <div className="font-cond text-xl font-bold text-black">
                  {simState.comparisonResult.errorRateBeforePercent}% → {simState.comparisonResult.errorRateAfterPercent}%
                </div>
              </div>

              <div className="bg-[#f9f9f9] p-3 rounded-[4px] border border-[#ececec]">
                <div className="font-mono text-[10px] text-[#777777] uppercase mb-1">
                  Latency Delta
                </div>
                <div className="font-cond text-2xl font-bold text-black">
                  -{simState.comparisonResult.calculatedLatencyDeltaPercent}%
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-[#777777]">
              * Values derived deterministically from the client-side state machine. No live website configuration or server traffic was altered.
            </p>
          </div>
        )}

        {/* 7. Event History Audit Log */}
        <div className="bg-white rounded-[8px] p-5 md:p-6 border border-[#dcdcdc]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0f0f0]">
            <div>
              <h3 className="font-cond text-2xl font-[700] uppercase tracking-[-0.02em] text-black">
                Event History
              </h3>
            </div>
            <span className="font-mono text-xs text-[#777777]">
              {simState.eventHistory.length} recorded events
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#f2f2f2]">
            {simState.eventHistory.map(evt => (
              <div key={evt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-[#888888] w-14 shrink-0">
                  +{evt.timeLabel}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs font-semibold text-black">
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#777777] uppercase font-semibold">
                      [{evt.category}]
                    </span>
                  </div>
                  <p className="font-body text-xs text-[#666666] mt-0.5">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 8. Dashboard Brutalist Footer */}
      <footer className="px-6 md:px-10 py-5 border-t border-[#d8d8d8] text-xs font-mono text-[#777777] bg-[#e5e5e5]">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 WebOps Project. College Research &amp; Demonstration Prototype.</div>
          <div className="text-[#666666]">
            ACADEMIC PROTOTYPE · LOCAL SIMULATION RUNTIME
          </div>
        </div>
      </footer>
    </div>
  );
};
