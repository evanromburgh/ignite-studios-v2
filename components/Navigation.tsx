import React, { useState, useRef, useEffect } from 'react';
import { AppUser, ViewContext } from '../types';

interface NavigationProps {
  user: AppUser;
  viewContext: ViewContext;
  isSyncing: boolean;
  isLoggingOut: boolean;
  wishlistCount: number;
  reservationsCount: number;
  onNavigate: (context: ViewContext) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  viewContext,
  isSyncing,
  isLoggingOut,
  wishlistCount,
  reservationsCount,
  onNavigate,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setShowMobileMenu(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const userInitials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email ? user.email[0].toUpperCase() : '?';

  const navLinks: { label: string; context: ViewContext }[] = [
    { label: 'Properties', context: 'INVENTORY' },
    { label: 'Documents', context: 'DOCUMENTS' },
    { label: 'Contact', context: 'CONTACT' },
  ];

  const handleNav = (context: ViewContext) => {
    onNavigate(context);
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  return (
    <>
      {/* Mobile menu backdrop - dims content behind when menu is open */}
      <div
        role="presentation"
        aria-hidden={!showMobileMenu}
        className={`lg:hidden fixed inset-0 z-[140] backdrop-blur-[5px] transition-opacity duration-300 ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowMobileMenu(false)}
      />
      <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-b border-white/5 z-[150] flex flex-col">
        {/* Top row - header only */}
        <div className="pl-5 pr-5 sm:pl-8 sm:pr-8 md:px-24 h-16 sm:h-24 flex items-center justify-between flex-shrink-0">
          {/* Logo */}
          <div
            className="cursor-pointer group flex items-center shrink-0"
            onClick={() => handleNav('INVENTORY')}
          >
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-white group-hover:text-zinc-400 transition-colors leading-none">IGNITE</span>
            <div className="h-5 sm:h-5 w-[1px] bg-zinc-800 mx-2 sm:mx-4"></div>
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center space-x-10 mr-6">
              {isSyncing && (
                <div className="flex items-center h-[46px] gap-2 px-4 bg-white/5 rounded-full border border-white/10 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase">Syncing</span>
                </div>
              )}
              {navLinks.map(link => (
                <button
                  key={link.context}
                  onClick={() => handleNav(link.context)}
                  className={`h-[46px] px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${viewContext === link.context ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* User Avatar - not clickable on mobile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-9 h-9 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-full transition-all group overflow-hidden relative border pointer-events-none lg:pointer-events-auto cursor-default lg:cursor-pointer ${showUserMenu ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-zinc-400 lg:hover:text-white lg:hover:border-white/20'}`}
                title="Profile Settings"
              >
                <span className="relative z-10 text-[9px] sm:text-[10px] font-black">{userInitials}</span>
                {!showUserMenu && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
              </button>

              {showUserMenu && (
                <div className="hidden lg:block absolute top-full right-0 mt-3 sm:mt-[1.3rem] w-56 sm:w-64 bg-black/95 backdrop-blur-2xl rounded-xl p-2 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[200]">
                  <button
                    type="button"
                    onClick={() => handleNav('RESERVATIONS')}
                    className="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group mb-1"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">My Reservations</span>
                    {reservationsCount > 0 && <span className="ml-auto bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">{reservationsCount}</span>}
                  </button>
                  <div className="h-[1px] bg-white/5 mx-2 my-1"></div>
                  <button
                    type="button"
                    onClick={() => handleNav('WISHLIST')}
                    className="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group mb-1"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Wishlist</span>
                    {wishlistCount > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">{wishlistCount}</span>}
                  </button>
                  <div className="h-[1px] bg-white/5 mx-2 my-1"></div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isLoggingOut ? 'Ending Session...' : 'Sign Out'}
                    </span>
                    <svg className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger - always visible on mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden w-5 h-5 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-lg relative shrink-0"
              aria-label="Toggle navigation menu"
            >
              <div className="w-5 h-5 relative flex items-center justify-center">
                <span
                  className={`absolute block w-5 h-[2px] bg-white transition-all duration-300 ease-in-out ${showMobileMenu ? 'rotate-45 top-[9px]' : 'top-[3px]'}`}
                />
                <span
                  className={`absolute block w-5 h-[2px] bg-white transition-all duration-300 ease-in-out top-[9px] ${showMobileMenu ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
                />
                <span
                  className={`absolute block w-5 h-[2px] bg-white transition-all duration-300 ease-in-out ${showMobileMenu ? '-rotate-45 top-[9px]' : 'top-[15px]'}`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu - same nav, expands down */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${showMobileMenu ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col items-stretch pt-0 pb-6 pl-5 pr-5 sm:pl-8 sm:pr-8">
            {navLinks.map((link, index) => (
              <React.Fragment key={link.context}>
                <div className="w-full flex">
                  <div className="w-full max-w-xs mx-auto">
                    <button
                      onClick={() => handleNav(link.context)}
                      className={`w-full h-12 text-left text-[10px] font-black uppercase tracking-widest transition-all ${viewContext === link.context ? 'text-white' : 'text-zinc-400'}`}
                    >
                      {link.label}
                    </button>
                  </div>
                </div>
                {index < navLinks.length - 1 && <div className="w-full h-[1px] bg-zinc-800 my-1" />}
              </React.Fragment>
            ))}

            <div className="w-full h-[1px] bg-zinc-800 my-1" />

            <div className="w-full flex">
              <div className="w-full max-w-xs mx-auto">
                <button
                  onClick={() => handleNav('RESERVATIONS')}
                  className={`w-full h-12 text-left text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${viewContext === 'RESERVATIONS' ? 'text-white' : 'text-zinc-400'}`}
                >
                  My Reservations
                  <span className={`inline-grid place-items-center w-5 h-5 min-w-5 min-h-5 rounded-full ml-auto text-[9px] font-black tabular-nums tracking-normal leading-[0] select-none ${reservationsCount > 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-500'}`}>{reservationsCount}</span>
                </button>
              </div>
            </div>

            <div className="w-full h-[1px] bg-zinc-800 my-1" />

            <div className="w-full flex">
              <div className="w-full max-w-xs mx-auto">
                <button
                  onClick={() => handleNav('WISHLIST')}
                  className={`w-full h-12 text-left text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${viewContext === 'WISHLIST' ? 'text-white' : 'text-zinc-400'}`}
                >
                  Wishlist
                  <span className={`inline-grid place-items-center w-5 h-5 min-w-5 min-h-5 rounded-full ml-auto text-[9px] font-black tabular-nums tracking-normal leading-[0] select-none ${wishlistCount > 0 ? 'bg-red-500 text-white' : 'bg-white/10 text-zinc-500'}`}>{wishlistCount}</span>
                </button>
              </div>
            </div>

            <div className="w-full h-[1px] bg-zinc-800 my-1" />

            <div className="w-full flex">
              <div className="w-full max-w-xs mx-auto">
                <button
                  onClick={() => { setShowMobileMenu(false); onLogout(); }}
                  className={`w-full h-12 text-left text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-3 ${isLoggingOut ? 'text-zinc-400' : 'text-red-500'}`}
                >
                  <span>{isLoggingOut ? 'Ending Session...' : 'Sign Out'}</span>
                  {!isLoggingOut && (
                    <svg className="w-4 h-4 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
