import React, { useState, useEffect } from 'react';
import { DayosLogo } from './DayosLogo';
import { HoverLoop } from './HoverLoop';

interface NavbarProps {
  currentTheme?: 'grey' | 'black' | 'white';
  onNavigate?: (route: 'home' | 'optimize') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTheme = 'grey', onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    const handleScroll = () => {
      if (activeDropdown) setActiveDropdown(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDropdown]);

  const navItems = [
    {
      label: 'Platform',
      submenu: [
        { title: 'Telemetry & Metrics', href: '#workflow' },
        { title: 'Prediction Models', href: '#workflow' },
        { title: 'Action Safety', href: '#workflow' }
      ]
    },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Architecture', href: '#architecture' },
    {
      label: 'Scenarios',
      submenu: [
        { title: 'Simulated Concurrency', href: '#scenarios' },
        { title: 'Database Pressure', href: '#scenarios' },
        { title: 'State Restoration', href: '#scenarios' }
      ]
    },
    { label: 'Domains', href: '#domains' },
    { label: 'Ecosystem', href: '#ecosystem' },
    {
      label: 'Project',
      submenu: [
        { title: 'Prototype Overview', href: '#top' },
        { title: 'Engineering Scope', href: '#architecture' }
      ]
    }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-6 md:px-10 pt-6">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between pointer-events-auto">
          {/* Left: Logo & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white text-black"
              aria-label="Toggle navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current stroke-2">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>
            <a
              href="#top"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('home');
                }
              }}
              className="flex items-center"
              aria-label="WebOps Homepage"
            >
              <DayosLogo className="h-6 md:h-7 w-auto" theme={currentTheme === 'black' ? 'white' : 'black'} />
            </a>
          </div>

          {/* Center: Floating Pill Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center bg-white rounded-[48px] px-6 py-2.5 transition-colors duration-300">
            <ul className="flex items-center gap-5 text-[14px] font-medium tracking-tight text-[#444444]">
              {navItems.map((item, idx) => (
                <li key={idx} className="relative group">
                  {item.submenu ? (
                    <div
                      onMouseEnter={() => setActiveDropdown(item.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                      className="relative py-1"
                    >
                      <button className="flex items-center gap-1.5 hover:text-black transition-colors focus:outline-none cursor-pointer">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black transition-colors"></span>
                        <HoverLoop className="font-body text-[14px] font-[500] text-[#444444] group-hover:text-black">
                          {item.label}
                        </HoverLoop>
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === item.label && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                          <div className="bg-white rounded-2xl p-2 min-w-[180px] border border-[#e5e5e5]/60 flex flex-col gap-1">
                            {item.submenu.map((sub, sIdx) => (
                              <a
                                key={sIdx}
                                href={sub.href}
                                className="px-3 py-2 text-[13px] text-[#444444] hover:text-black hover:bg-[#f3f3f3] rounded-lg transition-colors font-body"
                              >
                                <HoverLoop>{sub.title}</HoverLoop>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className="flex items-center gap-1.5 hover:text-black transition-colors py-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black transition-colors"></span>
                      <HoverLoop className="font-body text-[14px] font-[500] text-[#444444] hover:text-black">
                        {item.label}
                      </HoverLoop>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: CTA Button */}
          <div className="flex items-center">
            <a
              href="#optimize"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('optimize');
                }
              }}
              className="bg-[#000000] text-[#ffffff] text-[15px] font-[500] px-5 py-3 rounded-[8px] hover:bg-[#222222] transition-colors inline-flex items-center justify-center font-body"
            >
              <HoverLoop>Optimize Your Website</HoverLoop>
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#000000]/95 backdrop-blur-md md:hidden pt-28 px-6 pb-12 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-6">
            {navItems.map((item, idx) => (
              <div key={idx} className="border-b border-[#2f2f2f] pb-4">
                <div className="text-white text-2xl font-cond tracking-wide mb-2">
                  {item.label}
                </div>
                {item.submenu && (
                  <div className="flex flex-col gap-2 pl-3">
                    {item.submenu.map((sub, sIdx) => (
                      <a
                        key={sIdx}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[#979797] text-sm font-body hover:text-white"
                      >
                        {sub.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-8">
            <a
              href="#optimize"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('optimize');
                }
              }}
              className="w-full bg-[#d1ffca] text-black font-body font-medium text-center py-4 rounded-lg block"
            >
              Optimize Your Website
            </a>
          </div>
        </div>
      )}
    </>
  );
};
