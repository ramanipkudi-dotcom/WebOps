import React, { useState, useEffect } from 'react';
import { DayosLogo } from './DayosLogo';
import { HoverLoop } from './HoverLoop';

interface UrlEntryPageProps {
  onBackToHome: () => void;
  onWebsiteConfirmed: (url: string) => void;
}

export const UrlEntryPage: React.FC<UrlEntryPageProps> = ({
  onBackToHome,
  onWebsiteConfirmed
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [normalizedUrl, setNormalizedUrl] = useState('');
  const [stage, setStage] = useState<'entry' | 'confirmed' | 'loading' | 'placeholder_submitted'>('entry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Status messages for Phase C Step 3
  const loadingSteps = [
    { label: 'REGISTERING TARGET', percent: 33 },
    { label: 'PREPARING ANALYSIS WORKSPACE', percent: 68 },
    { label: 'INITIALIZING DEMONSTRATION ENVIRONMENT', percent: 100 }
  ];

  // Handle Loading Transition
  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;

    if (stage === 'loading') {
      setLoadingStep(0);
      t1 = setTimeout(() => {
        setLoadingStep(1);
      }, 700);

      t2 = setTimeout(() => {
        setLoadingStep(2);
      }, 1450);

      t3 = setTimeout(() => {
        onWebsiteConfirmed(normalizedUrl);
      }, 2250);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stage, normalizedUrl, onWebsiteConfirmed]);

  // Validate and normalize target URL
  const validateAndNormalize = (raw: string): { isValid: boolean; normalized?: string; error?: string } => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a website URL to continue.' };
    }

    const lower = trimmed.toLowerCase();
    const forbiddenProtocols = ['javascript:', 'file:', 'data:', 'ftp:', 'vbscript:', 'blob:', 'about:'];
    for (const proto of forbiddenProtocols) {
      if (lower.startsWith(proto)) {
        return {
          isValid: false,
          error: `The "${proto}" protocol is unsupported. Please enter a valid HTTP or HTTPS website URL.`
        };
      }
    }

    // Prepend https:// if no scheme is provided
    let candidate = trimmed;
    if (!/^https?:\/\//i.test(trimmed)) {
      candidate = 'https://' + trimmed;
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, error: 'Only HTTP and HTTPS website protocols are supported.' };
      }

      if (!parsed.hostname) {
        return { isValid: false, error: 'Please enter a valid website address with a domain name.' };
      }

      const hostname = parsed.hostname;
      if (hostname.startsWith('.') || hostname.endsWith('.') || hostname.includes('..')) {
        return { isValid: false, error: 'The website domain format is invalid.' };
      }

      // Check for valid domain, IP, or localhost
      const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
      const isLocalhost = hostname === 'localhost';
      const isDomain = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(hostname);

      if (!isIp && !isLocalhost && !isDomain) {
        return {
          isValid: false,
          error: 'Please enter a valid domain address (e.g., example.com or https://example.com).'
        };
      }

      return { isValid: true, normalized: parsed.href };
    } catch {
      return {
        isValid: false,
        error: 'Unable to parse this website address. Please check for typos and try again.'
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = validateAndNormalize(urlInput);

    if (!result.isValid) {
      setError(result.error || 'Invalid URL entered.');
      setIsSubmitting(false);
      return;
    }

    setNormalizedUrl(result.normalized!);
    setIsSubmitting(false);
    setStage('confirmed');
  };

  const handleConfirmWebsite = () => {
    if (stage === 'loading') return;
    setStage('loading');
  };

  const handleEditUrl = () => {
    setError(null);
    setStage('entry');
  };

  const handleReset = () => {
    setUrlInput('');
    setNormalizedUrl('');
    setError(null);
    setStage('entry');
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col justify-between selection:bg-[#d1ffca] selection:text-[#000000]">
      {/* 1. Page Header */}
      <header className="px-6 md:px-10 pt-8 pb-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center group cursor-pointer focus:outline-none"
            aria-label="Return to WebOps Homepage"
          >
            <DayosLogo className="h-6 md:h-7 w-auto" theme="black" />
          </button>

          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 bg-white text-[#444444] hover:text-black px-4 py-2 rounded-full font-body text-[14px] font-[500] border border-[#d6d6d6] transition-colors cursor-pointer"
          >
            <span>←</span>
            <HoverLoop>Back to Overview</HoverLoop>
          </button>
        </div>
      </header>

      {/* 2. Main Card Content */}
      <main className="flex-1 px-6 md:px-10 py-12 md:py-16 flex items-center justify-center">
        <div className="w-full max-w-[760px]">
          {/* State 1: URL Entry Form */}
          {stage === 'entry' && (
            <div className="bg-white rounded-[32px] p-8 sm:p-12 md:p-16 border border-[#dcdcdc] shadow-sm">
              <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-medium tracking-wider mb-6">
                WEBOPS / WEBSITE ANALYSIS
              </span>

              <h1 className="font-cond text-[44px] sm:text-[56px] md:text-[68px] font-[700] uppercase tracking-[-0.03em] leading-[0.92] text-black mb-6">
                LET'S OPTIMIZE<br />YOUR WEBSITE.
              </h1>

              <p className="font-body text-[16px] md:text-[18px] text-[#444444] leading-[1.4] max-w-[580px] mb-10">
                Enter your website URL to begin. WebOps is an academic prototype exploring website performance analysis and predictive optimization.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-6">
                  <label
                    htmlFor="website-url"
                    className="block font-mono text-[12px] font-semibold uppercase tracking-wider text-[#444444] mb-3"
                  >
                    WEBSITE URL
                  </label>

                  <div className="relative">
                    <input
                      id="website-url"
                      type="text"
                      autoComplete="url"
                      autoFocus
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="https://yourwebsite.com"
                      aria-invalid={!!error}
                      aria-describedby={error ? 'url-error url-note' : 'url-note'}
                      className={`w-full bg-[#f3f3f3] text-black font-mono text-[16px] md:text-[18px] px-5 py-4 rounded-[12px] border transition-all focus:bg-white focus:outline-none ${
                        error
                          ? 'border-[#d32f2f] focus:border-[#d32f2f] bg-[#fff8f8]'
                          : 'border-transparent focus:border-black'
                      }`}
                    />
                  </div>

                  {error && (
                    <div
                      id="url-error"
                      role="alert"
                      className="mt-3 flex items-start gap-2 text-[#d32f2f] font-body text-[14px] font-medium"
                    >
                      <span className="text-[16px] leading-tight font-bold">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#000000] text-white px-8 py-4 rounded-[8px] font-body text-[16px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <HoverLoop>Continue</HoverLoop>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="border border-[#d0d0d0] text-black px-6 py-4 rounded-[8px] font-body text-[15px] font-[500] hover:border-black transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div id="url-note" className="mt-8 pt-6 border-t border-[#f0f0f0] font-body text-[14px] text-[#777777] leading-relaxed">
                Supported protocols: HTTP, HTTPS. WebOps evaluates observable metrics within simulated research scenarios without making intrusive scans.
              </div>
            </div>
          )}

          {/* State 2: Confirmation State */}
          {stage === 'confirmed' && (
            <div className="bg-white rounded-[32px] p-8 sm:p-12 md:p-16 border border-[#dcdcdc] shadow-sm">
              <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-medium tracking-wider mb-6">
                URL VERIFIED
              </span>

              <h1 className="font-cond text-[44px] sm:text-[56px] md:text-[68px] font-[700] uppercase tracking-[-0.03em] leading-[0.92] text-black mb-6">
                CONFIRM TARGET<br />WEBSITE.
              </h1>

              <p className="font-body text-[16px] md:text-[18px] text-[#444444] leading-[1.4] max-w-[580px] mb-8">
                Please verify the normalized target website address below before confirming.
              </p>

              <div className="bg-[#f7f7f7] border border-[#e5e5e5] rounded-[16px] p-6 mb-8">
                <span className="block font-mono text-[11px] text-[#777777] uppercase tracking-wider mb-2">
                  NORMALIZED WEBSITE ADDRESS
                </span>
                <div className="font-mono text-[18px] md:text-[22px] font-bold text-black break-all">
                  {normalizedUrl}
                </div>
              </div>

              <div className="bg-[#fcfcfc] border border-[#ededed] rounded-[12px] p-4 mb-8 text-[13px] font-mono text-[#555555] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d1ffca]"></span>
                <span>Client-side validation verified. No requests have been dispatched to this domain.</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={handleConfirmWebsite}
                  className="bg-[#000000] text-white px-8 py-4 rounded-[8px] font-body text-[16px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HoverLoop>Confirm Website</HoverLoop>
                  <span>✓</span>
                </button>

                <button
                  type="button"
                  onClick={handleEditUrl}
                  className="border border-[#d0d0d0] text-black px-6 py-4 rounded-[8px] font-body text-[15px] font-[500] hover:border-black transition-colors inline-flex items-center justify-center cursor-pointer"
                >
                  Edit Address
                </button>
              </div>

              <p className="mt-8 pt-6 border-t border-[#f0f0f0] font-body text-[14px] text-[#777777] leading-relaxed">
                Confirming initializes a dedicated performance workspace. No monitoring, ML prediction, or server infrastructure changes will be performed on the target website.
              </p>
            </div>
          )}

          {/* State 3: Polished Loading Transition (Phase C Step 3) */}
          {stage === 'loading' && (
            <div className="bg-white rounded-[32px] p-8 sm:p-12 md:p-16 border border-[#dcdcdc] shadow-sm text-center">
              <span className="inline-block bg-[#fff100] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-bold tracking-wider mb-6">
                WORKSPACE INITIALIZATION
              </span>

              <h2 className="font-cond text-[38px] sm:text-[48px] md:text-[56px] font-[700] uppercase tracking-[-0.03em] leading-[0.92] text-black mb-4">
                PREPARING WORKSPACE.
              </h2>

              <p className="font-body text-[15px] md:text-[17px] text-[#555555] max-w-[500px] mx-auto mb-10">
                Initializing the performance demonstration environment for <strong className="text-black font-mono">{normalizedUrl}</strong>.
              </p>

              {/* Progress Container */}
              <div className="max-w-[460px] mx-auto mb-10">
                {/* Status Message */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-pulse"></span>
                  <span className="font-mono text-sm font-bold tracking-wider text-black">
                    {loadingSteps[loadingStep].label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#f0f0f0] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#e5e5e5]">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${loadingSteps[loadingStep].percent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-[#888888]">
                  <span>Step {loadingStep + 1} of 3</span>
                  <span>{loadingSteps[loadingStep].percent}%</span>
                </div>
              </div>

              {/* Truthful Boundary Notice */}
              <div className="bg-[#fcfcfc] border border-[#ededed] rounded-[14px] p-4 text-xs font-mono text-[#666666] max-w-[520px] mx-auto text-left">
                <span className="font-bold text-black block mb-1">Demonstration Workspace Sandbox:</span>
                This initialization generates an isolated, in-memory telemetry model. No external probes or server configuration modifications are dispatched to the target.
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setStage('confirmed')}
                  className="text-xs font-mono text-[#888888] hover:text-black transition-colors underline cursor-pointer"
                >
                  Cancel and return to verification
                </button>
              </div>
            </div>
          )}

          {/* State 4: Legacy Fallback Placeholder State */}
          {stage === 'placeholder_submitted' && (
            <div className="bg-white rounded-[32px] p-8 sm:p-12 md:p-16 border border-[#dcdcdc] shadow-sm">
              <span className="inline-block bg-[#fff100] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-semibold tracking-wider mb-6">
                PHASE 3A COMPLETE
              </span>

              <h1 className="font-cond text-[44px] sm:text-[56px] md:text-[68px] font-[700] uppercase tracking-[-0.03em] leading-[0.92] text-black mb-6">
                WEBSITE REGISTERED<br />FOR ANALYSIS.
              </h1>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="bg-[#000000] text-white px-8 py-4 rounded-[8px] font-body text-[16px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HoverLoop>Return to Homepage</HoverLoop>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="border border-[#d0d0d0] text-black px-6 py-4 rounded-[8px] font-body text-[15px] font-[500] hover:border-black transition-colors inline-flex items-center justify-center cursor-pointer"
                >
                  Analyze Another Website
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. Minimal Footer */}
      <footer className="px-6 md:px-10 py-6 border-t border-[#d8d8d8] text-xs font-mono text-[#777777]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 WebOps Project. College Research &amp; Prototype Demonstration.</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d1ffca] animate-pulse"></span>
            <span>ACADEMIC PROTOTYPE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
