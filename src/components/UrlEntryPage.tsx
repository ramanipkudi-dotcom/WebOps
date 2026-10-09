import React, { useState, useEffect } from 'react';
import { DayosLogo } from './DayosLogo';
import { HoverLoop } from './HoverLoop';
import {
  validateUrlFormat,
  checkWebsiteReachability,
  ReachabilityStatus
} from '../utils/urlValidator';

interface UrlEntryPageProps {
  onBackToHome: () => void;
  onWebsiteConfirmed: (url: string) => void;
}

export const UrlEntryPage: React.FC<UrlEntryPageProps> = ({
  onBackToHome,
  onWebsiteConfirmed
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [formatError, setFormatError] = useState<string | null>(null);
  const [reachabilityNotice, setReachabilityNotice] = useState<{
    status: ReachabilityStatus;
    error?: string;
    message?: string;
  } | null>(null);
  const [normalizedUrl, setNormalizedUrl] = useState('');
  const [isVerifiedReachable, setIsVerifiedReachable] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [stage, setStage] = useState<'entry' | 'confirmed' | 'loading'>('entry');

  // Handle Bounded Loading Transition
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (stage === 'loading') {
      timer = setTimeout(() => {
        onWebsiteConfirmed(normalizedUrl);
      }, 1600);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [stage, normalizedUrl, onWebsiteConfirmed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidating) return; // Prevent duplicate submission

    setFormatError(null);
    setReachabilityNotice(null);
    setIsValidating(true);

    // 1. Format and safety validation
    const formatResult = validateUrlFormat(urlInput);
    if (!formatResult.isValid) {
      setFormatError(formatResult.error || 'Invalid website address.');
      setIsValidating(false);
      return;
    }

    const candidateUrl = formatResult.normalized!;
    setNormalizedUrl(candidateUrl);

    // 2. Safe, bounded reachability check
    try {
      const reachability = await checkWebsiteReachability(candidateUrl, 4000);

      if (reachability.reachable && reachability.status === 'verified') {
        // Direct verification succeeded
        setIsVerifiedReachable(true);
        setReachabilityNotice(null);
        setIsValidating(false);
        setStage('confirmed');
      } else if (reachability.status === 'timeout' || reachability.status === 'http_error') {
        // Definitively failed reachability (timed out or HTTP error)
        setFormatError(reachability.error || 'The target website could not be reached.');
        setIsValidating(false);
      } else {
        // cors_inconclusive: Format is valid, but browser CORS prevents verification
        setIsVerifiedReachable(false);
        setReachabilityNotice({
          status: 'cors_inconclusive',
          error: reachability.error
        });
        setIsValidating(false);
      }
    } catch {
      setFormatError('An unexpected error occurred during address verification. Please try again.');
      setIsValidating(false);
    }
  };

  const handleProceedUnverified = () => {
    setStage('confirmed');
  };

  const handleConfirmWebsite = () => {
    if (stage === 'loading') return;
    setStage('loading');
  };

  const handleEditUrl = () => {
    setFormatError(null);
    setReachabilityNotice(null);
    setStage('entry');
  };

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col justify-between selection:bg-[#d1ffca] selection:text-[#000000]">
      {/* 1. Header */}
      <header className="px-6 md:px-10 pt-7 pb-4">
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
            className="inline-flex items-center gap-2 bg-white text-[#444444] hover:text-black px-3.5 py-1.5 rounded-[4px] font-body text-xs font-medium border border-[#d2d2d2] transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Back to Overview</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 px-6 md:px-10 py-10 md:py-14 flex items-center justify-center">
        <div className="w-full max-w-[680px]">
          {/* State 1: URL Entry Form */}
          {stage === 'entry' && (
            <div className="bg-white rounded-[8px] p-8 sm:p-12 border border-[#dcdcdc]">
              <span className="inline-block bg-[#f3f3f3] text-[#555555] text-[11px] font-mono px-2.5 py-0.5 rounded-[3px] font-semibold tracking-wider uppercase mb-5">
                Target Configuration
              </span>

              <h1 className="font-cond text-[38px] sm:text-[46px] md:text-[52px] font-[700] uppercase tracking-[-0.03em] leading-none text-black mb-4">
                Optimize Your Website
              </h1>

              <p className="font-body text-sm text-[#555555] leading-relaxed mb-8">
                Enter your website URL to begin. WebOps will validate the address format and check connectivity before establishing the performance workspace.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-6">
                  <label
                    htmlFor="website-url"
                    className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#444444] mb-2.5"
                  >
                    Website URL
                  </label>

                  <div className="relative">
                    <input
                      id="website-url"
                      type="text"
                      autoComplete="url"
                      autoFocus
                      disabled={isValidating}
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (formatError) setFormatError(null);
                        if (reachabilityNotice) setReachabilityNotice(null);
                      }}
                      placeholder="https://example.com"
                      aria-invalid={!!formatError}
                      aria-describedby={formatError ? 'url-error url-note' : 'url-note'}
                      className={`w-full bg-[#f8f8f8] text-black font-mono text-sm sm:text-base px-4 py-3.5 rounded-[4px] border transition-colors focus:bg-white focus:outline-none ${
                        formatError
                          ? 'border-[#dc2626] focus:border-[#dc2626]'
                          : 'border-[#d0d0d0] focus:border-black'
                      }`}
                    />
                  </div>

                  {/* Immediate Validation Error Alert */}
                  {formatError && (
                    <div
                      id="url-error"
                      role="alert"
                      className="mt-3 p-3 bg-[#fff8f8] border border-[#fecaca] rounded-[4px] text-[#b91c1c] font-body text-xs leading-relaxed"
                    >
                      <span className="font-semibold mr-1">Validation Error:</span>
                      {formatError}
                    </div>
                  )}

                  {/* Reachability Inconclusive / CORS Notice */}
                  {reachabilityNotice && reachabilityNotice.status === 'cors_inconclusive' && (
                    <div
                      role="alert"
                      className="mt-4 p-4 bg-[#fbfbfb] border border-[#d8d8d8] rounded-[6px] text-xs font-body text-[#333333] space-y-3"
                    >
                      <div className="font-semibold text-black flex items-center gap-2">
                        <span>Browser Reachability Inconclusive</span>
                      </div>
                      <p className="text-[#555555] leading-relaxed">
                        The URL format is valid, but direct browser connectivity check was blocked by cross-origin security policies (CORS). Without a backend validation proxy, the browser cannot confirm whether this external host is currently online.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={handleProceedUnverified}
                          className="bg-black text-white hover:bg-[#222222] px-4 py-2 rounded-[4px] font-body text-xs font-medium transition-colors cursor-pointer"
                        >
                          Proceed in Simulation Mode (Unverified Target) →
                        </button>
                        <button
                          type="button"
                          onClick={() => setReachabilityNotice(null)}
                          className="border border-[#cccccc] hover:border-black text-black px-3.5 py-2 rounded-[4px] font-body text-xs font-medium transition-colors cursor-pointer"
                        >
                          Edit URL
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isValidating}
                    className="bg-black text-white px-7 py-3 rounded-[4px] font-body text-sm font-medium hover:bg-[#222222] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        <span>Validating target…</span>
                      </>
                    ) : (
                      <>
                        <HoverLoop>Continue</HoverLoop>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onBackToHome}
                    disabled={isValidating}
                    className="border border-[#d0d0d0] text-black px-5 py-3 rounded-[4px] font-body text-sm font-medium hover:border-black transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div id="url-note" className="mt-8 pt-5 border-t border-[#f0f0f0] font-body text-xs text-[#777777] leading-relaxed">
                Accepts HTTP and HTTPS protocols. Internal network addresses and private IP ranges are restricted for safety.
              </div>
            </div>
          )}

          {/* State 2: Confirmation State */}
          {stage === 'confirmed' && (
            <div className="bg-white rounded-[8px] p-8 sm:p-12 border border-[#dcdcdc]">
              <span className="inline-block bg-[#f3f3f3] text-[#555555] text-[11px] font-mono px-2.5 py-0.5 rounded-[3px] font-semibold tracking-wider uppercase mb-5">
                Target Verification
              </span>

              <h1 className="font-cond text-[38px] sm:text-[46px] md:text-[52px] font-[700] uppercase tracking-[-0.03em] leading-none text-black mb-4">
                Confirm Target Website
              </h1>

              <p className="font-body text-sm text-[#555555] leading-relaxed mb-6">
                Please review the normalized target address and verification status before initializing the demonstration workspace.
              </p>

              {/* Normalized Address Box */}
              <div className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-[6px] p-5 mb-5">
                <span className="block font-mono text-[10px] text-[#777777] uppercase tracking-wider mb-1.5">
                  Normalized Website Address
                </span>
                <div className="font-mono text-base sm:text-lg font-bold text-black break-all">
                  {normalizedUrl}
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 bg-[#fbfbfb] border border-[#eaeaea] rounded-[6px] mb-6 text-xs font-mono text-[#555555]">
                {isVerifiedReachable ? (
                  <div className="text-[#15803d]">
                    ✓ Reachability Verified · Target responded successfully to browser probe.
                  </div>
                ) : (
                  <div className="text-[#666666]">
                    ● Format Valid · Reachability unverified due to browser cross-origin policy (CORS).
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmWebsite}
                  className="bg-black text-white px-7 py-3 rounded-[4px] font-body text-sm font-medium hover:bg-[#222222] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HoverLoop>Confirm Website</HoverLoop>
                  <span>✓</span>
                </button>

                <button
                  type="button"
                  onClick={handleEditUrl}
                  className="border border-[#d0d0d0] text-black px-5 py-3 rounded-[4px] font-body text-sm font-medium hover:border-black transition-colors inline-flex items-center justify-center cursor-pointer"
                >
                  Edit Address
                </button>
              </div>

              <p className="mt-7 pt-4 border-t border-[#f0f0f0] font-body text-xs text-[#777777] leading-relaxed">
                Confirming initializes an in-memory performance simulation workspace. No external probes or configuration modifications will be performed on the target website.
              </p>
            </div>
          )}

          {/* State 3: Minimal, Clean Loading Screen (Section 2 Refinement) */}
          {stage === 'loading' && (
            <div
              className="flex flex-col items-center justify-center py-24 text-center select-none"
              role="status"
              aria-live="polite"
            >
              {/* Subtle, elegant loading spinner */}
              <div className="relative w-7 h-7 mb-4" aria-hidden="true">
                <div className="w-7 h-7 rounded-full border-2 border-black/15 border-t-black animate-spin motion-reduce:animate-none"></div>
              </div>

              {/* Understated loading label in clean, modern sans-serif */}
              <p className="font-body text-[15px] text-[#444444] font-normal tracking-normal">
                Preparing workspace…
              </p>
              <span className="sr-only">Initializing performance demonstration workspace</span>
            </div>
          )}
        </div>
      </main>

      {/* 3. Minimal Footer */}
      <footer className="px-6 md:px-10 py-5 border-t border-[#d8d8d8] text-xs font-mono text-[#777777] bg-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 WebOps Project. College Research &amp; Prototype Demonstration.</div>
          <div>ACADEMIC PROTOTYPE</div>
        </div>
      </footer>
    </div>
  );
};
