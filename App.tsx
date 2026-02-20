import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AppUser, Unit, ViewMode, SearchFilters, ViewContext } from './types';
import { CONFIG } from './config';
import { MOCK_DOCUMENTS } from './constants';
import { UnitCard, formatPrice } from './components/UnitCard';
import { UnitListRow } from './components/UnitListRow';
import { ReservationCard } from './components/ReservationCard';
import { UnitDetails } from './components/UnitDetails';
import { ContactForm } from './components/ContactForm';
import { unitService } from './services/unitService';
import { authService } from './services/authService';
import { wishlistService } from './services/wishlistService';
import { reservationService } from './services/reservationService';
import { AdminUnitForm } from './components/AdminUnitForm';
import { BulkSyncModal } from './components/BulkSyncModal';
import { DocumentCard } from './components/DocumentCard';
import { ReservationView } from './components/ReservationView';
import { AuthPortal } from './components/AuthPortal';
import { Navigation } from './components/Navigation';
import { FilterBar } from './components/FilterBar';
import { PaymentCancel, PAYMENT_CANCELLED_TOAST_KEY } from './components/PaymentCancel';
import { useToast } from './components/Toast';

const PATH_LIST_VIEWS: Record<string, ViewContext> = {
  '/wishlist': 'WISHLIST',
  '/reservations': 'RESERVATIONS',
  '/documents': 'DOCUMENTS',
  '/contact': 'CONTACT',
};

function viewContextFromPath(): ViewContext {
  if (typeof window === 'undefined') return 'INVENTORY';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return PATH_LIST_VIEWS[path] ?? 'INVENTORY';
}

function pathForViewContext(context: ViewContext): string {
  if (context === 'WISHLIST') return '/wishlist';
  if (context === 'RESERVATIONS') return '/reservations';
  if (context === 'DOCUMENTS') return '/documents';
  if (context === 'CONTACT') return '/contact';
  return '/'; // INVENTORY, UNIT_DETAIL, RESERVE
}

function pushPathForViewContext(context: ViewContext) {
  const path = pathForViewContext(context);
  const url = window.location.origin + path + window.location.search;
  if (context === 'UNIT_DETAIL' || context === 'RESERVE') {
    // Don't leave /documents in URL when opening unit/reservation; refresh should return home
    window.history.replaceState({ viewContext: 'INVENTORY' }, '', url);
  } else {
    window.history.pushState({ viewContext: context }, '', url);
  }
}

const App: React.FC = () => {
  const { toast, confirm } = useToast();

  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [viewContext, setViewContext] = useState<ViewContext>(viewContextFromPath);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null | boolean>(false);
  const [isBulkSyncOpen, setIsBulkSyncOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);
  const [isPaymentCancelPage, setIsPaymentCancelPage] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [reservedUnitIds, setReservedUnitIds] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<SearchFilters>({
    maxPrice: 'all',
    bedrooms: 'all',
    bathrooms: 'all',
    status: 'all',
  });

  // Start at top of page on load/refresh
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // Sync view from URL on popstate (back/forward)
  useEffect(() => {
    const onPopState = () => {
      setViewContext(viewContextFromPath());
      setSelectedUnit(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Check URL for payment-cancel route (and listen for changes)
  useEffect(() => {
    const checkPath = () => {
      const pathname = window.location.pathname;
      setIsPaymentCancelPage(pathname === '/payment-cancel');
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  // After redirect from payment-cancel, show a one-time toast on the properties page
  useEffect(() => {
    if (sessionStorage.getItem(PAYMENT_CANCELLED_TOAST_KEY)) {
      sessionStorage.removeItem(PAYMENT_CANCELLED_TOAST_KEY);
      toast('Payment cancelled. The unit remains available.', 'success');
    }
  }, [toast]);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Entrance transition when user signs in or app loads with auth
  const [hasTriggeredInitialTransition, setHasTriggeredInitialTransition] = useState(false);
  useEffect(() => {
    if (user && !authLoading && !hasTriggeredInitialTransition) {
      setIsTransitioning(true);
      setTransitionKey(prev => prev + 1);
      setHasTriggeredInitialTransition(true);
      setViewContext(viewContextFromPath());
      setSelectedUnit(null);
      // Reset filters to default values when signing in
      setFilters({
        maxPrice: 'all',
        bedrooms: 'all',
        bathrooms: 'all',
        status: 'all',
      });
      window.scrollTo(0, 0);

      setTimeout(() => {
        window.scrollTo(0, 0);
        setIsEntranceComplete(true);
      }, CONFIG.TRANSITION_MID_MS);
      setTimeout(() => setIsTransitioning(false), CONFIG.TRANSITION_END_MS);
    }
  }, [user, authLoading, hasTriggeredInitialTransition]);

  // Stable long-lived subscription for units
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = unitService.subscribeToUnits((updatedUnits) => {
      setUnits(updatedUnits);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.id]);

  // Subscribe to wishlist for the current user
  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    
    const unsubscribe = wishlistService.subscribeToWishlist(user.id, (unitIds) => {
      setWishlistIds(unitIds);
    });
    
    return () => unsubscribe();
  }, [user?.id]);

  // Subscribe to reserved units for the current user (profiles.reserved_unit_ids)
  useEffect(() => {
    if (!user) {
      setReservedUnitIds([]);
      return;
    }
    
    const unsubscribe = reservationService.subscribeToReservedUnits(user.id, (unitIds) => {
      setReservedUnitIds(unitIds);
    });
    
    return () => unsubscribe();
  }, [user?.id]);

  // Sync selected unit when the main list updates
  useEffect(() => {
    if (selectedUnit) {
      const fresh = units.find(u => u.id === selectedUnit.id);
      if (fresh) setSelectedUnit(fresh);
    }
  }, [units, selectedUnit?.id]);

  const transitionTo = useCallback((context: ViewContext, unit: Unit | null = null) => {
    if (isTransitioning) return;
    if (context === viewContext && unit?.id === selectedUnit?.id) return;

    setIsTransitioning(true);
    setTransitionKey(prev => prev + 1);

    setTimeout(() => {
      setViewContext(context);
      setSelectedUnit(unit);
      pushPathForViewContext(context);
      window.scrollTo(0, 0);
    }, CONFIG.TRANSITION_MID_MS);

    setTimeout(() => setIsTransitioning(false), CONFIG.TRANSITION_END_MS);
  }, [isTransitioning, viewContext, selectedUnit]);

  const handleReserveRequest = async (unit: Unit) => {
    if (isTransitioning || !user) return;
    
    setIsSyncing(true);
    const success = await unitService.acquireLock(unit.id, user.id);
    setIsSyncing(false);

    if (success) {
      const unitWithLock = { ...unit, lockExpiresAt: Date.now() + CONFIG.LOCK_DURATION_MS, lockedBy: user.id };
      transitionTo('RESERVE', unitWithLock);
    } else {
      toast("This unit is currently being reserved by another client. Please check back in a few minutes.", 'warning');
    }
  };

  const handleStatusChange = async (id: string, status: Unit['status']) => {
    setIsSyncing(true);
    await unitService.updateUnitStatus(id, status);
    setIsSyncing(false);
  };

  const handleSaveUnit = async (unit: Unit) => {
    setIsSyncing(true);
    await unitService.saveUnit(unit);
    setEditingUnit(false);
    setIsSyncing(false);
    toast("Unit saved successfully.", 'success');
  };

  const handleBulkImport = async (newUnits: Unit[]) => {
    setIsSyncing(true);
    await unitService.importUnits(newUnits);
    setIsSyncing(false);
  };

  const handleDeleteUnit = async (id: string) => {
    const ok = await confirm("Are you sure you want to remove this architectural asset from the inventory?");
    if (ok) {
      setIsSyncing(true);
      await unitService.deleteUnit(id);
      setIsSyncing(false);
      toast("Unit removed from inventory.", 'success');
    }
  };

  const handleReset = async () => {
    const ok = await confirm("This will wipe all cloud/local entries and restore factory demo data. Continue?");
    if (ok) {
      setIsSyncing(true);
      await unitService.resetDatabase();
      setIsSyncing(false);
      toast("Database restored to factory defaults.", 'success');
    }
  };

  const toggleWishlist = async (unitId: string) => {
    if (!user) return;
    
    const isWishlisted = wishlistIds.includes(unitId);
    try {
      await wishlistService.toggleWishlist(user.id, unitId, isWishlisted);
      // The subscription will automatically update wishlistIds
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast('Failed to update wishlist. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      setUser(null);
      setHasTriggeredInitialTransition(false);
      setIsEntranceComplete(false);
      setViewContext('INVENTORY');
      setWishlistIds([]);
      setReservedUnitIds([]);
      // Reset filters to default values
      setFilters({
        maxPrice: 'all',
        bedrooms: 'all',
        bathrooms: 'all',
        status: 'all',
      });
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayedUnits = useMemo(() => {
    let source: Unit[];
    
    if (viewContext === 'WISHLIST') {
      source = units.filter(u => wishlistIds.includes(u.id));
    } else if (viewContext === 'RESERVATIONS') {
      // Show units the user has reserved (stored in profiles.reserved_unit_ids)
      source = units.filter(u => reservedUnitIds.includes(u.id));
      // Don't apply filters to reservations view - show all reserved units
      return source;
    } else {
      source = units;
    }

    return source.filter(unit => {
      const matchesPrice = filters.maxPrice === 'all' || unit.price <= Number(filters.maxPrice);
      const matchesBeds = filters.bedrooms === 'all' || unit.bedrooms.toString() === filters.bedrooms;
      const matchesBaths = filters.bathrooms === 'all' || unit.bathrooms.toString() === filters.bathrooms;
      const matchesStatus = filters.status === 'all' || unit.status === filters.status;
      return matchesPrice && matchesBeds && matchesBaths && matchesStatus;
    });
  }, [filters, wishlistIds, reservedUnitIds, viewContext, units, user]);

  const totalUnits = units.length;
  const availableCount = units.filter(u => u.status === 'Available' && (!u.lockExpiresAt || u.lockExpiresAt <= Date.now())).length;
  const reservationsCount = reservedUnitIds.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-5">
        <div className="flex items-center animate-pulse">
          <span className="text-2xl sm:text-4xl font-black tracking-tighter text-white leading-none">IGNITE</span>
          <div className="h-4 sm:h-6 w-[1px] bg-zinc-800 mx-3 sm:mx-4"></div>
          <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
        </div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative">
      {isTransitioning && (
        <div key={`curtain-container-${transitionKey}`} className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute inset-0 bg-black animate-curtain" />
          <div className="absolute inset-0 flex items-center justify-center px-5">
            <div className="animate-logo-mask flex items-center">
              <span className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">IGNITE</span>
              <div className="h-6 sm:h-10 md:h-16 w-[1px] bg-zinc-800 mx-3 sm:mx-6 md:mx-10"></div>
              <span className="text-[10px] sm:text-[14px] md:text-[22px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
            </div>
          </div>
        </div>
      )}

      {isPaymentCancelPage ? (
        <PaymentCancel />
      ) : window.location.pathname === '/payment-cancel' ? (
        // Fallback: if pathname matches but state wasn't updated yet
        <PaymentCancel />
      ) : !user ? (
        <AuthPortal />
      ) : (
        <div className={`transition-opacity duration-700 ease-in-out ${isEntranceComplete ? 'opacity-100' : 'opacity-0'}`}>
          <Navigation
            user={user}
            viewContext={viewContext}
            isSyncing={isSyncing}
            isLoggingOut={isLoggingOut}
            wishlistCount={wishlistIds.length}
            reservationsCount={reservationsCount}
            onNavigate={(ctx) => transitionTo(ctx)}
            onLogout={handleLogout}
          />

          <div className="w-full">
            {viewContext === 'UNIT_DETAIL' && selectedUnit ? (
              <UnitDetails unit={selectedUnit} onClose={() => transitionTo('INVENTORY')} isWishlisted={wishlistIds.includes(selectedUnit.id)} onToggleWishlist={toggleWishlist} onReserve={handleReserveRequest} />
            ) : viewContext === 'RESERVE' && selectedUnit ? (
              <ReservationView unit={selectedUnit} onClose={() => transitionTo('INVENTORY')} />
            ) : viewContext === 'DOCUMENTS' ? (
              <div className="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-32 sm:pt-48 pb-0">
                <header className="mb-12 sm:mb-24">
                  <h1 className="text-4xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] mb-6 sm:mb-10">OFFICIAL<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 opacity-90 uppercase">Documentation</span></h1>
                  <p className="text-base sm:text-xl md:text-2xl text-zinc-500 font-light max-w-4xl leading-relaxed tracking-wide">Comprehensive access to all legal frameworks and site development blueprints.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {MOCK_DOCUMENTS.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
                </div>
              </div>
            ) : viewContext === 'CONTACT' ? (
              <div className="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-32 sm:pt-48 pb-0">
                <header className="mb-12 sm:mb-24"><h1 className="text-4xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] mb-6 sm:mb-10">SECURE YOUR<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 opacity-90 uppercase">Legacy</span></h1></header>
                <ContactForm />
              </div>
            ) : (
              <div className="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-32 sm:pt-48 pb-0">
                {(viewContext === 'INVENTORY' || viewContext === 'WISHLIST' || viewContext === 'RESERVATIONS') && (
                  <header className="mb-12 sm:mb-24 flex flex-col gap-8 sm:gap-12">
                    <div className="flex-1">
                      <h1 className="text-4xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] mb-6 sm:mb-10">
                        {viewContext === 'INVENTORY' ? 'IGNITE' : viewContext === 'RESERVATIONS' ? 'MY' : 'MY'}<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 opacity-90">
                          {viewContext === 'INVENTORY' ? 'STUDIOS' : viewContext === 'RESERVATIONS' ? 'RESERVATIONS' : 'SELECTIONS'}
                        </span>
                      </h1>
                      {isAdminMode && (
                        <div className="mb-10 flex flex-wrap gap-4 items-center">
                          <div className="h-[46px] px-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Cloud Pipeline Active</span>
                              <button onClick={handleReset} className="text-[8px] font-black text-zinc-600 uppercase mt-1.5 hover:text-white transition-colors underline text-left">Restore Factory Dataset</button>
                            </div>
                          </div>
                          <button onClick={() => setEditingUnit(true)} className="h-[46px] px-8 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl">
                            + New Asset
                          </button>
                          <button onClick={() => setIsBulkSyncOpen(true)} className="h-[46px] px-8 bg-zinc-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-zinc-500 transition-all">
                            Bulk Sync
                          </button>
                        </div>
                      )}
                      <p className="text-base sm:text-xl md:text-2xl text-zinc-500 font-light max-w-4xl leading-relaxed tracking-wide">
                        {viewContext === 'RESERVATIONS'
                          ? 'View and manage your reserved units in one place.'
                          : viewContext === 'WISHLIST'
                            ? 'Your saved units, all in one place.'
                            : 'Reserve your property quickly and securely from anywhere, anytime.'}
                      </p>
                    </div>
                  </header>
                )}

                {viewContext === 'INVENTORY' && (
                  <FilterBar
                    filters={filters}
                    viewMode={viewMode}
                    onFiltersChange={setFilters}
                    onViewModeChange={setViewMode}
                    availableCount={availableCount}
                    totalUnits={totalUnits}
                  />
                )}

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(totalUnits || 8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/[0.03] rounded-xl border border-white/5" />)}
                  </div>
                ) : viewContext === 'WISHLIST' && displayedUnits.length === 0 ? (
                  <div className="text-center py-48 bg-white/[0.01] backdrop-blur-3xl rounded-xl border border-white/5 shadow-inner">
                    <svg className="w-16 h-16 mx-auto mb-8 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">No Selections Yet</h3>
                    <p className="text-zinc-600 text-sm font-medium max-w-md mx-auto mb-10">Browse our properties and tap the heart icon to save units you're interested in.</p>
                    <button
                      onClick={() => transitionTo('INVENTORY')}
                      className="h-[46px] px-10 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      Browse Properties
                    </button>
                  </div>
                ) : viewContext === 'RESERVATIONS' && displayedUnits.length === 0 ? (
                  <div className="text-center py-48 bg-white/[0.01] backdrop-blur-3xl rounded-xl border border-white/5 shadow-inner">
                    <svg className="w-16 h-16 mx-auto mb-8 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">No Reservations Yet</h3>
                    <p className="text-zinc-600 text-sm font-medium max-w-md mx-auto mb-10">Reserve a property to see your reservations here. Your reserved units will appear once you complete the reservation process.</p>
                    <button
                      onClick={() => transitionTo('INVENTORY')}
                      className="h-[46px] px-10 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      Browse Properties
                    </button>
                  </div>
                ) : displayedUnits.length > 0 ? (
                  viewContext === 'RESERVATIONS' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {displayedUnits.map(unit => (
                        <ReservationCard key={unit.id} unit={unit} />
                      ))}
                    </div>
                  ) : (
                    <div className={viewMode === ViewMode.GRID ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "w-full space-y-4"}>
                      {displayedUnits.map(unit => (
                        viewMode === ViewMode.GRID 
                          ? <UnitCard key={unit.id} unit={unit} onSelect={(u) => transitionTo('UNIT_DETAIL', u)} onReserve={handleReserveRequest} isWishlisted={wishlistIds.includes(unit.id)} onToggleWishlist={toggleWishlist} isAdmin={isAdminMode} hideReservedOverlay={false} onStatusChange={handleStatusChange} onEdit={setEditingUnit} onDelete={handleDeleteUnit} />
                          : <UnitListRow key={unit.id} unit={unit} onSelect={(u) => transitionTo('UNIT_DETAIL', u)} onReserve={handleReserveRequest} isWishlisted={wishlistIds.includes(unit.id)} onToggleWishlist={toggleWishlist} isAdmin={isAdminMode} hideReservedOverlay={false} />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-48 bg-white/[0.01] backdrop-blur-3xl rounded-xl border border-white/5 shadow-inner">
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.5em]">No Matches</h3>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 mt-16 sm:mt-24 pt-12 sm:pt-20 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] gap-8 sm:gap-12 pb-12 sm:pb-20">
            <p>&copy; {new Date().getFullYear()} Ignite Studios</p>
            {user.role === 'admin' && (
              <button 
                onClick={() => setIsAdminMode(!isAdminMode)} 
                className={`h-[46px] px-8 rounded-full border transition-all flex items-center justify-center ${isAdminMode ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/10 text-zinc-800 hover:text-white hover:border-white/20'}`}
              >
                {isAdminMode ? 'ADMIN ACTIVE' : 'ADMIN ACCESS'}
              </button>
            )}
          </footer>
        </div>
      )}

      {editingUnit && <AdminUnitForm unit={typeof editingUnit === 'object' ? editingUnit : null} onSave={handleSaveUnit} onClose={() => setEditingUnit(false)} />}
      {isBulkSyncOpen && <BulkSyncModal currentUnits={units} onImport={handleBulkImport} onClose={() => setIsBulkSyncOpen(false)} />}
    </div>
  );
};

export default App;
