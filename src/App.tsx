import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DayosLogo } from './components/DayosLogo';
import { HoverLoop } from './components/HoverLoop';
import { Mouse3dRotate } from './components/Mouse3dRotate';
import { Globe } from './components/Globe';
import { UrlEntryPage } from './components/UrlEntryPage';
import { Dashboard } from './components/Dashboard';
import { RegisteredWebsite, WebsiteSimulationState } from './types/simulation';
import { createInitialStateForWebsite } from './utils/simulationEngine';

export function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeDepartment, setActiveDepartment] = useState(0);
  const [navTheme, setNavTheme] = useState<'grey' | 'black' | 'white'>('grey');

  // In-memory website registry with isolated simulation states
  const [websites, setWebsites] = useState<RegisteredWebsite[]>(() => {
    const initialDemo: RegisteredWebsite = {
      id: 'site-demo',
      url: 'https://demo.webops.network',
      hostname: 'demo.webops.network',
      registeredAt: Date.now(),
      simulationState: createInitialStateForWebsite('demo.webops.network')
    };
    return [initialDemo];
  });
  const [activeWebsiteId, setActiveWebsiteId] = useState<string>('site-demo');

  const [currentRoute, setCurrentRoute] = useState<'home' | 'optimize' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#dashboard') return 'dashboard';
      if (window.location.hash === '#optimize') return 'optimize';
    }
    return 'home';
  });

  // Track hash changes for zero-dependency client-side routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#dashboard') {
        setCurrentRoute('dashboard');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#optimize') {
        setCurrentRoute('optimize');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (route: 'home' | 'optimize' | 'dashboard') => {
    if (route === 'dashboard') {
      window.location.hash = 'dashboard';
      setCurrentRoute('dashboard');
    } else if (route === 'optimize') {
      window.location.hash = 'optimize';
      setCurrentRoute('optimize');
    } else {
      if (window.location.hash) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
      setCurrentRoute('home');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleWebsiteConfirmed = (normalizedUrl: string) => {
    try {
      const parsed = new URL(normalizedUrl);
      const hostname = parsed.hostname;
      const existing = websites.find(w => w.hostname === hostname);
      if (existing) {
        setActiveWebsiteId(existing.id);
      } else {
        const newId = `site-${Date.now()}`;
        const newSite: RegisteredWebsite = {
          id: newId,
          url: normalizedUrl,
          hostname,
          registeredAt: Date.now(),
          simulationState: createInitialStateForWebsite(hostname)
        };
        setWebsites(prev => [newSite, ...prev]);
        setActiveWebsiteId(newId);
      }
      navigateTo('dashboard');
    } catch (e) {
      console.error('Error handling confirmed URL', e);
    }
  };

  const handleUpdateWebsiteState = (id: string, newState: WebsiteSimulationState) => {
    setWebsites(prev =>
      prev.map(site => (site.id === id ? { ...site, simulationState: newState } : site))
    );
  };

  // Track scroll position to update nav theme
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const blackSection = document.getElementById('workflow') || document.getElementById('black-section');
      const whiteSection = document.getElementById('scenarios') || document.getElementById('white-section');

      if (blackSection && whiteSection) {
        const blackTop = blackSection.offsetTop - 100;
        const whiteTop = whiteSection.offsetTop - 100;

        if (scrollY >= whiteTop) {
          setNavTheme('grey');
        } else if (scrollY >= blackTop) {
          setNavTheme('black');
        } else {
          setNavTheme('grey');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const caseStudies = [
    {
      title: 'Traffic Spike Mitigation.',
      desc: 'Simulates an abrupt surge in incoming HTTP requests. The controller models aggressive static asset caching and compression headers to protect upstream servers.',
      img: '/assets/subpillars/accounting-generalLedger.webp',
      tag: '01 / CONCURRENCY SURGE'
    },
    {
      title: 'Simulated Query Contention.',
      desc: 'Models backend response delays caused by database connection saturation, testing how temporary read-path caching helps isolate core transaction pathways.',
      img: '/assets/subpillars/it-integrate.webp',
      tag: '02 / DATABASE PRESSURE'
    },
    {
      title: 'Automated State Restoration.',
      desc: 'Demonstrates the recovery phase once modeled request volume recedes, ensuring the system safely restores standard cache TTLs without manual intervention.',
      img: '/assets/subpillars/accounting-accountsReceivable.webp',
      tag: '03 / EQUILIBRIUM RETURN'
    }
  ];

  const brandIntegrations = [
    { name: 'Oracle', logo: '/assets/logos/oracle.svg', hoverBg: 'hover:bg-[#d1ffca]' },
    { name: 'SAP', logo: '/assets/logos/sap.svg', hoverBg: 'hover:bg-[#ffc0cb]' },
    { name: 'Workday', logo: '/assets/logos/workday.svg', hoverBg: 'hover:bg-[#a6d5fa]' },
    { name: 'ServiceNow', logo: '/assets/logos/servicenow.svg', hoverBg: 'hover:bg-[#ffb366]' },
    { name: 'Coupa', logo: '/assets/logos/coupa.svg', hoverBg: 'hover:bg-[#b874fc]' },
    { name: 'Atlassian Jira', logo: '/assets/logos/jira.svg', hoverBg: 'hover:bg-[#d1ffca]' },
    { name: 'Anaplan', logo: '/assets/logos/anaplan.svg', hoverBg: 'hover:bg-[#ffc0cb]' },
    { name: 'Slack', logo: '/assets/logos/slack.svg', hoverBg: 'hover:bg-[#a6d5fa]' }
  ];

  const departments = [
    {
      name: 'Edge Caching',
      cube: '/assets/cubes/accounting.png',
      tag: 'CDN & Static Assets',
      title: 'Edge Cache Optimization',
      copy: 'Exploring how dynamic adjustments to Cache-Control headers and edge TTLs can reduce origin load during modeled traffic surges.'
    },
    {
      name: 'Concurrency',
      cube: '/assets/cubes/hr.png',
      tag: 'Traffic & Queueing',
      title: 'Concurrency & Throughput',
      copy: 'Analyzing how request rate forecasting can trigger preemptive rate-limiting models before thread exhaustion occurs.'
    },
    {
      name: 'Database Shield',
      cube: '/assets/cubes/procurement.png',
      tag: 'Connection Pool & I/O',
      title: 'Database Contention Management',
      copy: 'Investigating short-lived query result caching to buffer read-heavy paths when simulated connection queues rise.'
    },
    {
      name: 'Web Vitals',
      cube: '/assets/cubes/it.png',
      tag: 'LCP, CLS & TTFB',
      title: 'Frontend Latency & Vitals',
      copy: 'Tracking observable browser metrics to prioritize critical rendering paths and minimize client-side rendering delays.'
    },
    {
      name: 'Cold Starts',
      cube: '/assets/cubes/finance.png',
      tag: 'Compute & Serverless',
      title: 'Serverless Execution Delays',
      copy: 'Modeling how invocation forecasting can recommend worker pre-warming routines to alleviate cold-start latency.'
    }
  ];

  if (currentRoute === 'dashboard') {
    return (
      <Dashboard
        websites={websites}
        activeWebsiteId={activeWebsiteId}
        onSelectWebsite={(id) => setActiveWebsiteId(id)}
        onAddNewWebsite={() => navigateTo('optimize')}
        onBackToOverview={() => navigateTo('home')}
        onUpdateWebsiteState={handleUpdateWebsiteState}
      />
    );
  }

  if (currentRoute === 'optimize') {
    return (
      <UrlEntryPage
        onBackToHome={() => navigateTo('home')}
        onWebsiteConfirmed={handleWebsiteConfirmed}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      {/* 1. Floating Navigation Header */}
      <Navbar currentTheme={navTheme} onNavigate={navigateTo} />

      {/* 2. Hero Section */}
      <section id="top" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-10 overflow-hidden bg-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Hero Left: Headline & Copy */}
          <div className="lg:col-span-7 z-10">
            <h1 className="font-cond text-[68px] sm:text-[88px] md:text-[108px] lg:text-[124px] xl:text-[130px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-[#000000]">
              OBSERVE<br />
              TELEMETRY.<br />
              PREDICT<br />
              BOTTLENECKS.
            </h1>

            <p className="mt-8 md:mt-10 font-body text-[17px] md:text-[20px] leading-[1.3] text-[#444444] font-[450] max-w-[540px]">
              Traditional monitoring tools notify engineering teams after latency spikes occur. WebOps is a prototype exploring how machine learning can analyze observable website metrics, forecast degradation risks, and test automated recovery strategies.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="#optimize"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('optimize');
                }}
                className="bg-[#000000] text-white px-7 py-4 rounded-[8px] font-body text-[16px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center gap-2"
              >
                <HoverLoop>Optimize Your Website</HoverLoop>
              </a>
              <span className="font-mono text-xs text-[#979797] uppercase tracking-wider">
                College Research Prototype
              </span>
            </div>
          </div>

          {/* Hero Right: 3D React Bits Globe Interactive Component */}
          <div className="lg:col-span-5 flex items-center justify-center relative lg:-translate-y-[30px]">
            <div className="w-full max-w-[560px] aspect-square relative flex items-center justify-center">
              <Globe className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Black Inverted Section with 64px Top Arc */}
      <section id="workflow" className="relative bg-[#000000] text-white rounded-t-[64px] pt-24 md:pt-32 pb-24 px-6 md:px-10 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          {/* Part A: The 3 Theses (OBSERVE. PREDICT. MITIGATE.) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pb-24 border-b border-[#2f2f2f]">
            <div>
              <div className="font-cond text-[48px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white mb-4">
                OBSERVE.
              </div>
              <p className="font-body text-[16px] text-[#c6c6c6] leading-[1.35] max-w-[340px]">
                External synthetic probes record observable Time to First Byte (TTFB) and TLS handshake latency to establish reliable baseline response distributions.
              </p>
            </div>

            <div>
              <div className="font-cond text-[48px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white mb-4">
                PREDICT.
              </div>
              <p className="font-body text-[16px] text-[#c6c6c6] leading-[1.35] max-w-[340px]">
                Machine learning models evaluate telemetry trends to identify emerging latency degradation patterns before capacity thresholds are exceeded.
              </p>
            </div>

            <div>
              <div className="font-cond text-[48px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white mb-4">
                MITIGATE.
              </div>
              <p className="font-body text-[16px] text-[#c6c6c6] leading-[1.35] max-w-[340px]">
                The prototype models predefined, bounded adjustments—such as dynamic edge caching—and automatically evaluates state restoration when loads subside.
              </p>
            </div>
          </div>

          {/* Part B: Revolutionary Thesis Split */}
          <div className="py-24 border-b border-[#2f2f2f] grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <h2 className="font-cond text-[40px] sm:text-[56px] md:text-[72px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white">
                BRIDGING OBSERVABILITY AND AUTOMATED REMEDIATION.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="font-body text-[18px] md:text-[20px] text-[#979797] leading-[1.4]">
                Most web operations rely on reactive alerts: an incident occurs, an on-call engineer investigates, and configuration changes are applied under pressure. WebOps investigates a closed-loop approach—combining external measurement, predictive risk scoring, and controlled mitigation simulation to understand how systems can defend performance autonomously.
              </p>
            </div>
          </div>

          {/* Part C: Introducing Architecture + MacBook Pro Hardware Showcase */}
          <div id="architecture" className="py-24 border-b border-[#2f2f2f] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-medium tracking-wider mb-6">
                PROTOTYPE ARCHITECTURE
              </span>
              <h2 className="font-cond text-[48px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white mb-6">
                THE CLOSED-LOOP CONTROLLER
              </h2>
              <p className="font-body text-[16px] md:text-[18px] text-[#c6c6c6] leading-[1.4] mb-8 max-w-[500px]">
                The WebOps prototype is designed around a continuous feedback loop. Observable latency data is collected, evaluated against predictive thresholds, and mapped to predefined mitigation policies. In this phase, internal resource dynamics (such as database query queues and memory pools) are simulated to test mitigation logic without altering production infrastructure.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#workflow"
                  className="bg-white text-black px-6 py-3 rounded-[8px] font-body text-[15px] font-[500] hover:bg-[#e5e5e5] transition-colors inline-flex items-center"
                >
                  <HoverLoop>View 4-Stage Loop</HoverLoop>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[560px]">
                <img
                  src="/assets/images/mbp.png"
                  alt="WebOps Closed-Loop Controller on MacBook Pro"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Part D: The 4-Stage Optimization Engine in 3 Video Cards */}
          <div className="pt-24">
            <div className="mb-14">
              <h2 className="font-cond text-[44px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-white mb-4">
                THE FOUR-STAGE OPTIMIZATION ENGINE
              </h2>
              <p className="font-body text-[18px] text-[#979797] max-w-[620px]">
                The prototype models the full lifecycle: continuous telemetry collection, predictive risk scoring, targeted action simulation, and automated baseline recovery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Monitor & Predict */}
              <div className="bg-[#111111] border border-[#222222] rounded-[32px] p-6 md:p-8 flex flex-col justify-between group hover:border-[#333333] transition-colors">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-black flex items-center justify-center">
                    <video
                      src="/assets/videos/ai_solutions-loop.webm"
                      poster="/assets/posters/answers.png"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-0.5 rounded-[64px] font-medium mb-3">
                    Stages 1 & 2
                  </span>
                  <h3 className="font-cond text-[32px] md:text-[38px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-white mb-3">
                    Monitor & Predict
                  </h3>
                  <p className="font-body text-[15px] text-[#979797] leading-[1.35]">
                    Synthesizes observable HTTP latency curves and evaluates metric velocity with regression models to estimate whether a route is trending toward saturation.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#222222] flex items-center justify-between">
                  <a href="#workflow" className="font-body text-[14px] text-white flex items-center gap-2 group-hover:text-[#d1ffca] transition-colors">
                    <HoverLoop>Learn more</HoverLoop>
                    <span>→</span>
                  </a>
                </div>
              </div>

              {/* Card 2: Optimize */}
              <div className="bg-[#111111] border border-[#222222] rounded-[32px] p-6 md:p-8 flex flex-col justify-between group hover:border-[#333333] transition-colors">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-black flex items-center justify-center">
                    <video
                      src="/assets/videos/x_as_a_service-loop.webm"
                      poster="/assets/posters/actions.png"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-0.5 rounded-[64px] font-medium mb-3">
                    Stage 3
                  </span>
                  <h3 className="font-cond text-[32px] md:text-[38px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-white mb-3">
                    Predefined Optimization
                  </h3>
                  <p className="font-body text-[15px] text-[#979797] leading-[1.35]">
                    Applies validated, non-destructive mitigations—such as simulating tiered Cache-Control headers and stale-while-revalidate policies to buffer request volume.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#222222] flex items-center justify-between">
                  <a href="#workflow" className="font-body text-[14px] text-white flex items-center gap-2 group-hover:text-[#d1ffca] transition-colors">
                    <HoverLoop>Learn more</HoverLoop>
                    <span>→</span>
                  </a>
                </div>
              </div>

              {/* Card 3: Recover */}
              <div className="bg-[#111111] border border-[#222222] rounded-[32px] p-6 md:p-8 flex flex-col justify-between group hover:border-[#333333] transition-colors">
                <div>
                  <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-black flex items-center justify-center">
                    <video
                      src="/assets/videos/professional_services-loop.webm"
                      poster="/assets/posters/experts.png"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-0.5 rounded-[64px] font-medium mb-3">
                    Stage 4
                  </span>
                  <h3 className="font-cond text-[32px] md:text-[38px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-white mb-3">
                    Recovery & Rollback
                  </h3>
                  <p className="font-body text-[15px] text-[#979797] leading-[1.35]">
                    Monitors response stability as simulated traffic normalizes, verifying healthy latency distributions before reverting temporary optimization parameters.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#222222] flex items-center justify-between">
                  <a href="#workflow" className="font-body text-[14px] text-white flex items-center gap-2 group-hover:text-[#d1ffca] transition-colors">
                    <HoverLoop>Learn more</HoverLoop>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. White Inverted Section with 64px Top Arc */}
      <section id="scenarios" className="relative bg-[#ffffff] text-black rounded-t-[64px] -mt-10 pt-24 md:pt-32 pb-28 px-6 md:px-10 overflow-hidden z-20">
        <div className="max-w-[1200px] mx-auto">
          {/* Part A: Use Case Library Carousel */}
          <div className="pb-24 border-b border-[#e5e5e5]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="font-cond text-[48px] md:text-[68px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-black mb-4">
                  SIMULATED BOTTLENECK SCENARIOS.
                </h2>
                <p className="font-body text-[18px] text-[#444444] max-w-[560px]">
                  The prototype explores how closed-loop control principles apply across common web application stress scenarios in controlled simulations.
                </p>
              </div>

              {/* Slider Controls */}
              <div className="flex items-center gap-3">
                {caseStudies.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2.5 transition-all duration-300 rounded-full cursor-pointer ${
                      activeSlide === idx ? 'w-10 bg-black' : 'w-2.5 bg-[#c6c6c6] hover:bg-[#979797]'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Featured Active Case Study Card */}
            <div className="bg-[#f3f3f3] rounded-[32px] p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center transition-all duration-500">
              <div className="lg:col-span-7">
                <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-medium mb-4">
                  {caseStudies[activeSlide].tag}
                </span>
                <h3 className="font-cond text-[36px] sm:text-[44px] md:text-[52px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-black mb-5">
                  {caseStudies[activeSlide].title}
                </h3>
                <p className="font-body text-[16px] md:text-[18px] text-[#444444] leading-[1.4] mb-8 max-w-[520px]">
                  {caseStudies[activeSlide].desc}
                </p>
                <a
                  href="#scenarios"
                  className="bg-[#000000] text-white px-6 py-3.5 rounded-[8px] font-body text-[15px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center"
                >
                  <HoverLoop>Explore scenario</HoverLoop>
                </a>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden bg-white flex items-center justify-center p-4">
                  <img
                    src={caseStudies[activeSlide].img}
                    alt={caseStudies[activeSlide].title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Part B: Back Office Ecosystem (3D Mouse Tilt Brand Grid) */}
          <div id="ecosystem" className="pt-24">
            <div className="mb-14 max-w-[780px]">
              <h2 className="font-cond text-[44px] md:text-[64px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-black mb-4">
                TARGET ENTERPRISE TECHNOLOGY ENVIRONMENTS.
              </h2>
              <p className="font-body text-[18px] text-[#444444] leading-[1.35]">
                Modern web platforms frequently interface with complex enterprise systems, identity providers, and collaboration channels. WebOps is conceptualized to sit alongside multi-tier architectures, protecting client-facing response times and dispatching operational summaries to tools like Slack.
              </p>
            </div>

            {/* 8 Brand Tiles Grid with 3D Tilt and Exact Black Surface */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {brandIntegrations.map((brand, idx) => (
                <Mouse3dRotate key={idx} className="cursor-pointer">
                  <div className={`bg-[#000000] ${brand.hoverBg} group rounded-[32px] h-[130px] md:h-[150px] flex items-center justify-center p-6 transition-all duration-300`}>
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-[38px] w-auto transition-all duration-300 group-hover:filter group-hover:invert"
                    />
                  </div>
                </Mouse3dRotate>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Warm Canvas Performance Domains */}
      <section id="domains" className="relative bg-[#e5e5e5] text-black pt-24 md:pt-32 pb-28 px-6 md:px-10 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <h2 className="font-cond text-[48px] md:text-[72px] font-[700] uppercase tracking-[-0.03em] leading-[0.90] text-black mb-4">
              EXPLORING ARCHITECTURAL PERFORMANCE DOMAINS.
            </h2>
            <p className="font-body text-[18px] text-[#444444] max-w-[680px]">
              Performance degradation can originate at multiple layers of a web stack. Explore the primary technical domains modeled in the WebOps project.
            </p>
          </div>

          {/* Department Tab Buttons */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
            {departments.map((dept, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDepartment(idx)}
                className={`px-5 py-2.5 rounded-[48px] font-body text-[14px] font-[500] transition-colors cursor-pointer ${
                  activeDepartment === idx
                    ? 'bg-black text-white'
                    : 'bg-white text-[#444444] hover:text-black hover:bg-[#f3f3f3]'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>

          {/* Featured Department Card with Physical Concrete Cube */}
          <div className="bg-white rounded-[32px] p-8 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-1 rounded-[64px] font-medium mb-4">
                {departments[activeDepartment].tag}
              </span>
              <h3 className="font-cond text-[38px] sm:text-[48px] md:text-[56px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-black mb-5">
                {departments[activeDepartment].title}
              </h3>
              <p className="font-body text-[16px] md:text-[18px] text-[#444444] leading-[1.4] mb-8 max-w-[540px]">
                {departments[activeDepartment].copy}
              </p>
              <a
                href="#workflow"
                className="bg-[#000000] text-white px-7 py-3.5 rounded-[8px] font-body text-[15px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center"
              >
                <HoverLoop>Review Domain</HoverLoop>
              </a>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[380px] aspect-square flex items-center justify-center">
                <img
                  src={departments[activeDepartment].cube}
                  alt={`${departments[activeDepartment].name} 3D Physical Cube`}
                  className="w-full h-full object-contain filter contrast-[1.03]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dual Split CTA Cards */}
      <section className="bg-[#e5e5e5] px-6 md:px-10 pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Explore Workflow */}
          <div className="bg-white rounded-[32px] p-8 md:p-12 flex flex-col justify-between h-[320px] group hover:bg-[#fafafa] transition-colors">
            <div>
              <span className="inline-block bg-[#d1ffca] text-black text-[12px] font-mono px-3 py-0.5 rounded-[64px] font-medium mb-4">
                PROJECT SCOPE
              </span>
              <h3 className="font-cond text-[36px] md:text-[44px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-black mb-3">
                THE OPTIMIZATION CYCLE
              </h3>
              <p className="font-body text-[16px] text-[#444444] max-w-[380px]">
                Review how WebOps organizes telemetry collection, predictive ML risk estimation, and automated rollback into a coherent workflow.
              </p>
            </div>
            <div>
              <a
                href="#workflow"
                className="bg-black text-white px-6 py-3 rounded-[8px] font-body text-[15px] font-[500] hover:bg-[#222222] transition-colors inline-flex items-center"
              >
                <HoverLoop>Explore the Workflow</HoverLoop>
              </a>
            </div>
          </div>

          {/* Card 2: View Architecture */}
          <div className="bg-white rounded-[32px] p-8 md:p-12 flex flex-col justify-between h-[320px] group hover:bg-[#fafafa] transition-colors">
            <div>
              <span className="inline-block bg-[#f3f3f3] text-black text-[12px] font-mono px-3 py-0.5 rounded-[64px] font-medium mb-4">
                SYSTEM DESIGN
              </span>
              <h3 className="font-cond text-[36px] md:text-[44px] font-[700] uppercase tracking-[-0.02em] leading-[0.95] text-black mb-3">
                PROTOTYPE ARCHITECTURE
              </h3>
              <p className="font-body text-[16px] text-[#444444] max-w-[380px]">
                Examine the technical division between observable external measurements and simulated internal infrastructure models.
              </p>
            </div>
            <div>
              <a
                href="#architecture"
                className="border border-[#444444] text-[#444444] hover:text-black hover:border-black px-6 py-3 rounded-[4px] font-body text-[15px] font-[500] transition-colors inline-flex items-center"
              >
                <HoverLoop>View Architecture</HoverLoop>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Brutalist Black Footer */}
      <footer className="bg-[#000000] text-white pt-20 pb-12 px-6 md:px-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Top Row: Logo & Back to Top */}
          <div className="flex items-center justify-between pb-12 border-b border-[#2f2f2f]">
            <DayosLogo className="h-7 w-auto" theme="white" />
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs font-mono text-[#979797] hover:text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Back to top</span>
              <span>↑</span>
            </button>
          </div>

          {/* Project Information Row */}
          <div className="py-12 border-b border-[#2f2f2f]">
            <p className="font-body text-[17px] text-[#c6c6c6] leading-relaxed">
              WebOps is an ongoing academic engineering project exploring predictive web performance optimization.
            </p>
          </div>

          {/* Navigation Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-14 border-b border-[#2f2f2f]">
            <div>
              <h4 className="font-mono text-xs uppercase text-[#979797] tracking-wider mb-4">WORKFLOW</h4>
              <ul className="flex flex-col gap-2.5 text-sm font-body text-[#c6c6c6]">
                <li><a href="#workflow" className="hover:text-white transition-colors">1. Observation</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">2. Prediction</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">3. Optimization</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">4. Recovery</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-[#979797] tracking-wider mb-4">DOMAINS</h4>
              <ul className="flex flex-col gap-2.5 text-sm font-body text-[#c6c6c6]">
                <li><a href="#domains" className="hover:text-white transition-colors">Edge Caching</a></li>
                <li><a href="#domains" className="hover:text-white transition-colors">Concurrency</a></li>
                <li><a href="#domains" className="hover:text-white transition-colors">Database Shield</a></li>
                <li><a href="#domains" className="hover:text-white transition-colors">Web Vitals</a></li>
                <li><a href="#domains" className="hover:text-white transition-colors">Cold Starts</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-[#979797] tracking-wider mb-4">SCENARIOS</h4>
              <ul className="flex flex-col gap-2.5 text-sm font-body text-[#c6c6c6]">
                <li><a href="#scenarios" className="hover:text-white transition-colors">Traffic Surges</a></li>
                <li><a href="#scenarios" className="hover:text-white transition-colors">Queue Saturation</a></li>
                <li><a href="#scenarios" className="hover:text-white transition-colors">State Rollback</a></li>
                <li><a href="#scenarios" className="hover:text-white transition-colors">Failure Boundaries</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-[#979797] tracking-wider mb-4">ARCHITECTURE</h4>
              <ul className="flex flex-col gap-2.5 text-sm font-body text-[#c6c6c6]">
                <li><a href="#architecture" className="hover:text-white transition-colors">Telemetry Ingestion</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">ML Risk Model</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Predefined Policies</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Audit Logging</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-[#979797] tracking-wider mb-4">SPECIFICATIONS</h4>
              <ul className="flex flex-col gap-2.5 text-sm font-body text-[#c6c6c6]">
                <li><a href="#architecture" className="hover:text-white transition-colors">SSRF Safeguards</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Action Boundaries</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Reversibility</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Security Model</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Status */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#979797] gap-4">
            <div>
              © 2026 WebOps Project. College Research &amp; Prototype Demonstration.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d1ffca] animate-pulse"></span>
              <span className="text-[#c6c6c6]">ACADEMIC PROTOTYPE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
