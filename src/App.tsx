import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Player, Team, TeamId, BidRecord, SaleHistoryItem, BidStep } from './types';
import { INITIAL_TEAMS, TEAM_THEMES } from './data/teams';
import { DEFAULT_PLAYERS } from './data/defaultPlayers';
import { AuctionPodium } from './components/AuctionPodium';
import { BottomTeamDock } from './components/BottomTeamDock';
import { BiddingFeed } from './components/BiddingFeed';
import { TeamPurseSummaryModal } from './components/TeamPurseSummaryModal';
import { EditTeamPurseModal } from './components/EditTeamPurseModal';
import { RosterManagerModal } from './components/RosterManagerModal';
import { AddPlayerModal } from './components/AddPlayerModal';
import { PlayerVerificationModal } from './components/PlayerVerificationModal';
import { formatLakhsToDisplay } from './utils/currency';
import { playSoldFanfare, playGavelStrike } from './utils/audio';
import { exportPlayersToCSV } from './utils/csv';
import {
  TableProperties,
  Users,
  RotateCcw,
  Plus,
  CheckCircle2,
  Settings,
  X,
  Flag,
  Wallet,
} from 'lucide-react';

const SOMUN_LOGO = '/assets/aistudio/icon_2542cde0.png';

const STORAGE_KEY_PLAYERS = 'somun_ipl_players_v4';
const STORAGE_KEY_TEAMS = 'somun_ipl_teams_v4';
const STORAGE_KEY_BIDS = 'somun_ipl_bids_v4';
const STORAGE_KEY_ACTIVE_ID = 'somun_ipl_active_id_v4';
const STORAGE_KEY_SALES = 'somun_ipl_sales_v4';
const STORAGE_KEY_AUCTION_ENDED = 'somun_auction_ended_v4';

export default function App() {
  const [isAuctionEnded, setIsAuctionEnded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_AUCTION_ENDED) === 'true';
    } catch {
      return false;
    }
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PLAYERS;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TEAMS;
  });

  const [activePlayerId, setActivePlayerId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'p-101';
  });

  const [biddingHistory, setBiddingHistory] = useState<BidRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BIDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [salesHistory, setSalesHistory] = useState<SaleHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sold Celebration Animation State
  const [soldAnimationItem, setSoldAnimationItem] = useState<{
    player: Player;
    teamId: TeamId;
    price: number;
  } | null>(null);

  // Modals and menus
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isEditPurseOpen, setIsEditPurseOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
      localStorage.setItem(STORAGE_KEY_BIDS, JSON.stringify(biddingHistory));
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(salesHistory));
      localStorage.setItem(STORAGE_KEY_AUCTION_ENDED, String(isAuctionEnded));
      if (activePlayerId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activePlayerId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch (e) {
      console.error(e);
    }
  }, [players, teams, biddingHistory, salesHistory, activePlayerId, isAuctionEnded]);

  // Active player object
  const activePlayer = players.find((p) => p.id === activePlayerId) || null;

  // Set active player to 'in_auction' if not already
  useEffect(() => {
    if (activePlayer && activePlayer.status === 'draft') {
      const initialStep: BidStep = {
        price: activePlayer.basePrice,
        bidderTeamId: null,
        timestamp: Date.now(),
      };
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === activePlayer.id
            ? {
                ...p,
                status: 'in_auction',
                currentBid: p.basePrice,
                bidSteps: [initialStep],
              }
            : p
        )
      );
    }
  }, [activePlayerId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const availablePlayers = players.filter((p) => p.status === 'draft' || p.status === 'unsold');
  const upcomingPlayer = availablePlayers[0] || null;

  /**
   * Select current paddle holder without raising price.
   * Clicking the currently selected paddle holder franchisee button again deselects it.
   */
  const handleSelectPaddleHolder = (teamId: TeamId) => {
    if (!activePlayer) return;

    const isCurrentlySelected = activePlayer.currentBidderTeamId === teamId;
    const nextBidderTeamId: TeamId | null = isCurrentlySelected ? null : teamId;

    const currentPrice = activePlayer.currentBid || activePlayer.basePrice;
    const existingSteps: BidStep[] =
      activePlayer.bidSteps && activePlayer.bidSteps.length > 0
        ? activePlayer.bidSteps
        : [{ price: currentPrice, bidderTeamId: null, timestamp: Date.now() }];

    const lastStep = existingSteps[existingSteps.length - 1];
    const updatedSteps = [
      ...existingSteps.slice(0, -1),
      { ...lastStep, bidderTeamId: nextBidderTeamId },
    ];

    const updatedPlayer: Player = {
      ...activePlayer,
      currentBidderTeamId: nextBidderTeamId,
      bidSteps: updatedSteps,
    };

    setPlayers((prev) => prev.map((p) => (p.id === activePlayer.id ? updatedPlayer : p)));
    if (isCurrentlySelected) {
      showToast(`Paddle deselected (${teamId})`);
    } else {
      showToast(`Paddle assigned to ${teamId} (holding at ${formatLakhsToDisplay(currentPrice)})`);
    }
  };

  /**
   * Raise Bid by exact rule increment (Only triggered when Raise Bid button is clicked)
   */
  const handleRaiseBid = (incrementLakhs: number, biddingTeamId?: TeamId) => {
    if (!activePlayer) return;

    const current = activePlayer.currentBid || activePlayer.basePrice;
    const nextBid = current + incrementLakhs;
    const teamToUse = biddingTeamId || (activePlayer.currentBidderTeamId as TeamId) || null;

    const existingSteps: BidStep[] = activePlayer.bidSteps && activePlayer.bidSteps.length > 0
      ? activePlayer.bidSteps
      : [{ price: activePlayer.basePrice, bidderTeamId: null, timestamp: Date.now() }];

    const newStep: BidStep = {
      price: nextBid,
      bidderTeamId: teamToUse,
      timestamp: Date.now(),
    };

    const updatedPlayer: Player = {
      ...activePlayer,
      currentBid: nextBid,
      currentBidderTeamId: teamToUse,
      bidSteps: [...existingSteps, newStep],
    };

    setPlayers((prev) => prev.map((p) => (p.id === activePlayer.id ? updatedPlayer : p)));

    const bidRecord: BidRecord = {
      id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'raise',
      price: nextBid,
      increment: incrementLakhs,
      teamId: teamToUse,
      message: teamToUse
        ? `${teamToUse} raised bid to ${formatLakhsToDisplay(nextBid)}`
        : `Auctioneer raised bid to ${formatLakhsToDisplay(nextBid)}`,
    };

    setBiddingHistory((prev) => [...prev, bidRecord]);
    showToast(`Bid raised to ${formatLakhsToDisplay(nextBid)}${teamToUse ? ` for ${teamToUse}` : ''}`);
  };

  /**
   * Undo Raise: Revert a misclicked bid raise
   */
  const handleUndoRaise = () => {
    if (!activePlayer) return;

    const steps = activePlayer.bidSteps || [];
    if (steps.length <= 1) {
      showToast('Cannot undo raise: Already at starting base price.');
      return;
    }

    const previousStep = steps[steps.length - 2];
    const currentPrice = activePlayer.currentBid || activePlayer.basePrice;
    const updatedSteps = steps.slice(0, -1);

    const updatedPlayer: Player = {
      ...activePlayer,
      currentBid: previousStep.price,
      currentBidderTeamId: previousStep.bidderTeamId,
      bidSteps: updatedSteps,
    };

    setPlayers((prev) => prev.map((p) => (p.id === activePlayer.id ? updatedPlayer : p)));

    const bidRecord: BidRecord = {
      id: `bid-undo-raise-${Date.now()}`,
      timestamp: Date.now(),
      type: 'undo_raise',
      price: previousStep.price,
      teamId: previousStep.bidderTeamId,
      message: `UNDO RAISE: Price corrected back from ${formatLakhsToDisplay(currentPrice)} to ${formatLakhsToDisplay(previousStep.price)}.`,
    };

    setBiddingHistory((prev) => [...prev, bidRecord]);
    showToast(`Undo Raise: Price reverted to ${formatLakhsToDisplay(previousStep.price)}`);
  };

  const canUndoRaise = Boolean(
    activePlayer &&
      activePlayer.status === 'in_auction' &&
      ((activePlayer.bidSteps && activePlayer.bidSteps.length > 1) ||
        (activePlayer.currentBid && activePlayer.currentBid > activePlayer.basePrice))
  );

  const previousBidPrice =
    activePlayer?.bidSteps && activePlayer.bidSteps.length > 1
      ? activePlayer.bidSteps[activePlayer.bidSteps.length - 2].price
      : activePlayer?.basePrice;

  /**
   * Finalize and Sell to Team when bottom button clicked
   */
  const handleSellToTeam = (teamId: TeamId) => {
    if (!activePlayer) return;
    const currentPrice = activePlayer.currentBid || activePlayer.basePrice;

    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return;

    if (targetTeam.remainingPurse < currentPrice) {
      showToast(`Cannot sell to ${teamId}: Insufficient purse balance!`);
      return;
    }

    // Audio & Confetti
    playSoldFanfare();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#ef4444', '#b91c1c', '#dc2626', '#f87171', '#ffffff'],
    });

    // 1. Deduct team purse & add to squad (no overseas restrictions)
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            remainingPurse: t.remainingPurse - currentPrice,
            squad: [...t.squad, activePlayer.id],
          };
        }
        return t;
      })
    );

    // 2. Mark player sold
    const soldPlayer: Player = {
      ...activePlayer,
      status: 'sold',
      soldTo: teamId,
      soldPrice: currentPrice,
    };

    setPlayers((prev) => prev.map((p) => (p.id === activePlayer.id ? soldPlayer : p)));

    // 3. Record in sales history for UNDO
    const saleItem: SaleHistoryItem = {
      id: `sale-${Date.now()}`,
      player: activePlayer,
      teamId,
      price: currentPrice,
      timestamp: Date.now(),
    };
    setSalesHistory((prev) => [saleItem, ...prev]);

    // 4. Trigger Sold Animation Modal
    setSoldAnimationItem({
      player: activePlayer,
      teamId,
      price: currentPrice,
    });

    // 5. Log in feed
    const bidRecord: BidRecord = {
      id: `bid-sold-${Date.now()}`,
      timestamp: Date.now(),
      type: 'sold',
      price: currentPrice,
      teamId,
      message: `SOLD! ${activePlayer.name} (Player #${activePlayer.code}) sold to ${targetTeam.name} (${teamId}) for ${formatLakhsToDisplay(currentPrice)}! 🏆`,
    };
    setBiddingHistory((prev) => [...prev, bidRecord]);

    showToast(`SOLD! ${activePlayer.name} acquired by ${teamId} for ${formatLakhsToDisplay(currentPrice)}`);

    setActivePlayerId(null);
  };

  /**
   * Mark Unsold
   */
  const handleMarkUnsold = () => {
    if (!activePlayer) return;

    const unsoldPlayer: Player = {
      ...activePlayer,
      status: 'unsold',
      soldTo: null,
      soldPrice: null,
    };

    setPlayers((prev) => prev.map((p) => (p.id === activePlayer.id ? unsoldPlayer : p)));

    const bidRecord: BidRecord = {
      id: `bid-unsold-${Date.now()}`,
      timestamp: Date.now(),
      type: 'unsold',
      price: 0,
      teamId: null,
      message: `${activePlayer.name} (Player #${activePlayer.code}) passed UNSOLD at Base Price ${formatLakhsToDisplay(activePlayer.basePrice)}.`,
    };
    setBiddingHistory((prev) => [...prev, bidRecord]);

    showToast(`Player #${activePlayer.code} (${activePlayer.name}) marked UNSOLD.`);
    setActivePlayerId(null);
  };

  /**
   * UNDO last sale
   */
  const handleUndoLastSale = () => {
    if (salesHistory.length === 0) {
      showToast('No sale to undo.');
      return;
    }

    const [lastSale, ...remainingSales] = salesHistory;
    const { player, teamId, price } = lastSale;

    // Refund team purse and remove from squad
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            remainingPurse: t.remainingPurse + price,
            squad: t.squad.filter((id) => id !== player.id),
          };
        }
        return t;
      })
    );

    const restoredPlayer: Player = {
      ...player,
      status: 'in_auction',
      currentBid: price,
      soldTo: null,
      soldPrice: null,
      bidSteps: [{ price, bidderTeamId: teamId, timestamp: Date.now() }],
    };

    setPlayers((prev) => prev.map((p) => (p.id === player.id ? restoredPlayer : p)));
    setSalesHistory(remainingSales);
    setActivePlayerId(player.id);
    if (soldAnimationItem?.player.id === player.id) {
      setSoldAnimationItem(null);
    }

    const bidRecord: BidRecord = {
      id: `bid-undo-${Date.now()}`,
      timestamp: Date.now(),
      type: 'undo',
      price,
      teamId,
      message: `UNDO SALE: Reverted sale of ${player.name} to ${teamId}. Refunded ${formatLakhsToDisplay(price)} to franchise purse.`,
    };
    setBiddingHistory((prev) => [...prev, bidRecord]);

    playGavelStrike();
    showToast(`Sale of ${player.name} undone. Purse restored to ${teamId}.`);
  };

  /**
   * Next player verification callback
   */
  const handleVerifyAndReveal = (player: Player) => {
    playGavelStrike();
    const initialStep: BidStep = {
      price: player.basePrice,
      bidderTeamId: null,
      timestamp: Date.now(),
    };

    const primedPlayer: Player = {
      ...player,
      status: 'in_auction',
      currentBid: player.basePrice,
      currentBidderTeamId: null,
      soldTo: null,
      soldPrice: null,
      bidSteps: [initialStep],
    };

    setPlayers((prev) => prev.map((p) => (p.id === player.id ? primedPlayer : p)));
    setActivePlayerId(player.id);

    const bidRecord: BidRecord = {
      id: `bid-base-${Date.now()}`,
      timestamp: Date.now(),
      type: 'base',
      price: player.basePrice,
      teamId: null,
      message: `Player #${player.code} verified: ${player.name} (${player.role}, ${player.nation}) on auction block at Base Price ${formatLakhsToDisplay(player.basePrice)}.`,
    };
    setBiddingHistory((prev) => [...prev, bidRecord]);

    showToast(`Verified Player #${player.code}: ${player.name} is now LIVE on block!`);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* ========================================================= */}
      {/* TOP NAVIGATION BAR: Black & Red Theme + New SOMUN Logo */}
      {/* ========================================================= */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-black/95 border-b border-red-950/60 backdrop-blur-xl sticky top-0 z-40">
        {/* Left: New Attached SOMUN Logo + Title + Openable Summary Table Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={SOMUN_LOGO}
              alt="SOMUN"
              className="h-10 w-10 object-contain drop-shadow-md rounded-full bg-white/5 p-0.5"
            />
            <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
              SOMUN International Auctioneer
            </span>
          </div>

          {/* Top-left corner openable real-time summary table button */}
          <button
            onClick={() => setIsSummaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-red-950 text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ml-2"
            title="Open comprehensive real-time team purses and squad quotas"
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Team Purses Summary</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </button>

          {/* Auction Concluded Status Indicator */}
          {isAuctionEnded && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/80 text-red-300 text-xs font-black uppercase tracking-wider animate-pulse ml-1">
              <span>AUCTION CONCLUDED</span>
              <button
                onClick={() => {
                  setIsAuctionEnded(false);
                  showToast('Auction resumed! Controls and live draft are active.');
                }}
                className="text-[10px] font-sans font-bold underline text-white hover:text-red-200 cursor-pointer"
                title="Undo End Auction and resume bidding"
              >
                Resume
              </button>
            </div>
          )}
        </div>

        {/* Right Corner: Undo Sale + Settings Button (With Popover) */}
        <div className="flex items-center gap-2 relative" ref={settingsMenuRef}>
          {salesHistory.length > 0 && (
            <button
              onClick={handleUndoLastSale}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/60 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              title="Undo the last sold player and restore team purse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Sale</span>
            </button>
          )}

          {/* Settings Button in Top Right Corner */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSettingsOpen
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
            title="Open Auctioneer Settings & Roster Management"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Settings Dropdown Popover */}
          {isSettingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950 border border-red-950/80 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                  Auctioneer Settings
                </span>
                <span className="text-xs text-zinc-300 font-medium">SOMUN Command Center</span>
              </div>

              {/* Roster & CSV */}
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsRosterOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" />
                  <span>Roster Management & CSV</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-black px-1.5 py-0.5 rounded border border-zinc-800">
                  {players.length}
                </span>
              </button>

              {/* Add Player */}
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsAddPlayerOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-red-400" />
                <span>Add New Player to Draft</span>
              </button>

              {/* Change Team Purses */}
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditPurseOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-xs font-semibold text-zinc-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-red-400" />
                  <span>Change Team Purses</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-black px-1.5 py-0.5 rounded border border-zinc-800">
                  ₹ Cr
                </span>
              </button>

              {/* End Auction / Undo End Auction Action */}
              <div className="pt-1 mt-1 border-t border-zinc-850">
                {!isAuctionEnded ? (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsAuctionEnded(true);
                      setIsSummaryOpen(true);
                      showToast('Auction concluded! Viewing detailed final summary.');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-950/60 text-xs font-semibold text-red-300 hover:text-red-200 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                      <span>End Auction</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900/40">
                      Finalize
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsAuctionEnded(false);
                      showToast('Auction resumed! Controls and live draft are active.');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-950/60 text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Undo End Auction</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900/40">
                      Resume
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-zinc-950 border border-red-600/80 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN AUCTION STAGE: LIVE FEED TO THE LEFT OF LIVE PODIUM */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-36 space-y-4 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
          {/* LEFT: Live Bidding Feed (height exactly matches live podium) */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <BiddingFeed
              bids={biddingHistory}
              activePlayerCode={activePlayer?.code}
              activePlayerName={activePlayer?.name}
            />
          </div>

          {/* RIGHT: Live Podium (takes majority of screen space) */}
          <div className="lg:col-span-8 h-full flex flex-col">
            <AuctionPodium
              player={activePlayer}
              teams={teams}
              allPlayers={players}
              onRaiseBid={handleRaiseBid}
              onSelectPaddleHolder={handleSelectPaddleHolder}
              onUndoRaise={handleUndoRaise}
              canUndoRaise={canUndoRaise}
              previousBidPrice={previousBidPrice}
              onMarkUnsold={handleMarkUnsold}
              onNextPlayerClick={() => setIsVerifyOpen(true)}
              onUndoLastSale={handleUndoLastSale}
              canUndo={salesHistory.length > 0}
              lastSoldInfo={salesHistory[0] || null}
            />
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* BOTTOM FRANCHISE PADDLE DOCK (Dimmed theme colours, NO LOGOS) */}
      {/* ========================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-30">
        <BottomTeamDock
          teams={teams}
          activePlayer={activePlayer}
          currentBid={activePlayer ? activePlayer.currentBid || activePlayer.basePrice : 0}
          allPlayers={players}
          onSellToTeam={handleSellToTeam}
        />
      </footer>

      {/* ========================================================= */}
      {/* SOLD CELEBRATION ANIMATION OVERLAY (Black & Red Theme) */}
      {/* ========================================================= */}
      {soldAnimationItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn cursor-pointer"
          onClick={() => setSoldAnimationItem(null)}
        >
          <div
            className="bg-zinc-950 border-2 border-red-600 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative transform animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSoldAnimationItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Sold Badge */}
            <div className="inline-block px-6 py-2 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-widest mb-4 shadow-lg shadow-red-600/40 animate-pulse">
              SOLD!
            </div>

            {/* Player Name */}
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              {soldAnimationItem.player.name}
            </h2>
            <p className="text-sm text-zinc-400 mb-6 font-medium">
              Player #{soldAnimationItem.player.code} · {soldAnimationItem.player.role} · {soldAnimationItem.player.nation}
            </p>

            {/* Franchise & Price Box */}
            <div className="p-5 rounded-2xl bg-black border border-zinc-800 flex items-center justify-around mb-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                  Sold To Franchise
                </span>
                <span
                  className={`inline-block font-black text-base px-3 py-1 rounded border uppercase ${
                    TEAM_THEMES[soldAnimationItem.teamId].bg
                  } ${TEAM_THEMES[soldAnimationItem.teamId].text} ${TEAM_THEMES[soldAnimationItem.teamId].border}`}
                >
                  {soldAnimationItem.teamId}
                </span>
              </div>

              <div className="h-10 w-px bg-zinc-800" />

              <div>
                <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                  Final Price
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-red-400 tabular-nums">
                  {formatLakhsToDisplay(soldAnimationItem.price)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSoldAnimationItem(null)}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Continue Auction
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Real-Time Team Purse & Squad Summary Table (Top-Left Openable) */}
      <TeamPurseSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        teams={teams}
        allPlayers={players}
        isAuctionEnded={isAuctionEnded}
        onUndoEndAuction={() => {
          setIsAuctionEnded(false);
          showToast('Auction resumed! Controls and live draft are active.');
        }}
        onExportCSV={() => {
          exportPlayersToCSV(players);
          showToast('Exported entire auction history to CSV.');
        }}
        onOpenEditPurse={() => setIsEditPurseOpen(true)}
      />

      {/* 2. Roster Management, Search, Filters & CSV Sync */}
      <RosterManagerModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        players={players}
        onAddPlayerClick={() => {
          setIsRosterOpen(false);
          setIsAddPlayerOpen(true);
        }}
        onPutOnBlock={(player) => {
          handleVerifyAndReveal(player);
        }}
        onDeletePlayer={(id) => {
          setPlayers((prev) => prev.filter((p) => p.id !== id));
          if (activePlayerId === id) setActivePlayerId(null);
          showToast('Player deleted from pool.');
        }}
        onBulkUpdatePlayers={(importedPlayers) => {
          // Merge or update existing players by code, or append new players
          const existingMap = new Map(players.map((p) => [p.code, p]));
          importedPlayers.forEach((imported) => {
            const existing = existingMap.get(imported.code);
            if (existing) {
              existingMap.set(imported.code, {
                ...existing,
                ...imported,
                id: existing.id,
              });
            } else {
              existingMap.set(imported.code, imported);
            }
          });

          const mergedPlayers = Array.from(existingMap.values());
          setPlayers(mergedPlayers);

          // Recalculate team squads and remaining purses based on all sold players (preserving custom startingPurse)
          const newTeams = teams.map((team) => {
            const teamSoldPlayers = mergedPlayers.filter(
              (p) => p.status === 'sold' && p.soldTo === team.id
            );
            const spent = teamSoldPlayers.reduce(
              (sum, p) => sum + (p.soldPrice || p.basePrice),
              0
            );
            return {
              ...team,
              squad: teamSoldPlayers.map((p) => p.id),
              remainingPurse: Math.max(0, team.startingPurse - spent),
            };
          });
          setTeams(newTeams);

          // Rebuild sales history from all sold players
          const newSalesHistory: SaleHistoryItem[] = mergedPlayers
            .filter((p) => p.status === 'sold' && p.soldTo)
            .map((p, idx) => ({
              id: `sale-import-${p.id}`,
              player: p,
              teamId: p.soldTo as TeamId,
              price: p.soldPrice || p.basePrice,
              timestamp: Date.now() - idx * 1000,
            }));
          setSalesHistory(newSalesHistory);

          // Populate live feed with sold records
          const soldFeedEntries: BidRecord[] = newSalesHistory.map((s) => ({
            id: `bid-import-${s.id}`,
            timestamp: s.timestamp,
            type: 'sold',
            price: s.price,
            teamId: s.teamId,
            message: `SOLD! ${s.player.name} (Player #${s.player.code}) acquired by ${s.teamId} for ${formatLakhsToDisplay(s.price)}`,
          }));
          if (soldFeedEntries.length > 0) {
            setBiddingHistory(soldFeedEntries);
          }

          showToast(`Loaded ${importedPlayers.length} players and full auction history from CSV.`);
        }}
      />

      {/* 3. Add Player Modal */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onAddPlayer={(newPlayer) => {
          setPlayers((prev) => [newPlayer, ...prev]);
          showToast(`Player ${newPlayer.name} (Player #${newPlayer.code}) added to draft pool.`);
        }}
        existingCodes={players.map((p) => p.code)}
        suggestedCode={String(
          Math.max(...players.map((p) => parseInt(p.code, 10)).filter((n) => !isNaN(n)), 138) + 1
        ).padStart(3, '0')}
      />

      {/* 4. Next Player 3-Digit Code Verification Modal */}
      <PlayerVerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        upcomingPlayer={upcomingPlayer}
        draftPlayers={availablePlayers}
        onVerifyAndReveal={handleVerifyAndReveal}
      />

      {/* 5. Edit Team Purses Modal */}
      <EditTeamPurseModal
        isOpen={isEditPurseOpen}
        onClose={() => setIsEditPurseOpen(false)}
        teams={teams}
        allPlayers={players}
        onSavePurses={(updatedTeams) => {
          setTeams(updatedTeams);
          showToast('Franchise purses updated successfully!');
        }}
      />
    </div>
  );
}
