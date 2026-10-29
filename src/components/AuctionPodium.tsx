import React, { useState } from 'react';
import { Player, Team, TeamId } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { getBidIncrement, formatLakhsToDisplay } from '../utils/currency';
import {
  playBidChime,
  playUnsoldBuzzer,
  isAudioEnabled,
  setAudioEnabled,
} from '../utils/audio';
import {
  ArrowUp,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  Globe,
  Undo2,
} from 'lucide-react';

interface AuctionPodiumProps {
  player: Player | null;
  teams: Team[];
  allPlayers: Player[];
  onRaiseBid: (incrementLakhs: number, biddingTeamId?: TeamId) => void;
  onSelectPaddleHolder: (teamId: TeamId) => void;
  onUndoRaise: () => void;
  canUndoRaise: boolean;
  previousBidPrice?: number | null;
  onMarkUnsold: () => void;
  onNextPlayerClick: () => void;
  onUndoLastSale: () => void;
  canUndo: boolean;
  lastSoldInfo?: { player: Player; teamId: TeamId; price: number } | null;
}

const SOMUN_ICON = '/assets/aistudio/icon_2542cde0.png';

export const AuctionPodium: React.FC<AuctionPodiumProps> = ({
  player,
  teams,
  onRaiseBid,
  onSelectPaddleHolder,
  onUndoRaise,
  canUndoRaise,
  previousBidPrice,
  onMarkUnsold,
  onNextPlayerClick,
  onUndoLastSale,
  canUndo,
  lastSoldInfo,
}) => {
  const [soundOn, setSoundOn] = useState(isAudioEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setAudioEnabled(next);
  };

  if (!player) {
    return (
      <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl border border-red-950/60 p-8 text-center flex flex-col items-center justify-center h-full min-h-[460px] shadow-2xl">
        <div className="mb-4">
          <img
            src={SOMUN_ICON}
            alt="SOMUN"
            className="h-24 w-auto object-contain mx-auto drop-shadow-xl"
          />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">
          Auction Podium Idle
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
          No player currently on the live block. Click "Call Up Next Player" to verify the 3-digit player number and commence bidding.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onNextPlayerClick}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-red-950/40 transition-all cursor-pointer active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
            <span>Call Up Next Player (Verify Player #{player ? '' : ''})</span>
          </button>

          {canUndo && (
            <button
              onClick={onUndoLastSale}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold flex items-center gap-2 border border-zinc-800 transition-colors cursor-pointer"
              title="Undo last completed sale"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>Undo Last Sale</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentPrice = player.currentBid || player.basePrice;
  const currentIncrement = getBidIncrement(currentPrice);
  const nextPrice = currentPrice + currentIncrement;
  const leadingTeam = player.currentBidderTeamId
    ? teams.find((t) => t.id === player.currentBidderTeamId)
    : null;

  const handleIncrementClick = (teamId?: TeamId) => {
    playBidChime();
    onRaiseBid(currentIncrement, teamId);
  };

  const getIncrementRuleLabel = () => {
    if (currentPrice < 100) return 'Increment: ₹5 Lakhs (rule: < 1 Cr)';
    if (currentPrice < 1000) return 'Increment: ₹25 Lakhs (rule: 1 Cr to 10 Cr)';
    return 'Increment: ₹50 Lakhs (rule: 10 Cr+)';
  };

  return (
    <div className="bg-zinc-950/90 backdrop-blur-xl rounded-2xl border border-red-950/60 shadow-2xl overflow-hidden flex flex-col h-full min-h-[480px]">
      {/* Top Banner / Broadcast Ribbon (Black & Red) */}
      <div className="px-5 py-2.5 bg-black/95 border-b border-red-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-600/50 text-red-400 text-[11px] font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            LIVE ON PODIUM
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            SOMUN INTERNATIONAL AUCTION · PLAYER #{player.code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canUndo && (
            <button
              onClick={onUndoLastSale}
              className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={
                lastSoldInfo
                  ? `Undo sale of ${lastSoldInfo.player.name} to ${lastSoldInfo.teamId}`
                  : 'Undo last sale'
              }
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Sale</span>
            </button>
          )}

          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              soundOn
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white'
                : 'bg-black border-zinc-900 text-zinc-600'
            }`}
            title={soundOn ? 'Sound FX Enabled (Chimes)' : 'Muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Player Display Card (Properly top-aligned, not pushed down) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
        {/* Left Column: Player Bio & Credentials (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-700/80 text-red-200 font-mono font-black text-xs shadow-sm">
                PLAYER #{player.code}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800">
                {player.role}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5 text-red-400" />
                <span>{player.nation}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {player.name}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="text-zinc-300 font-medium">{player.nation}</span>
              <span>·</span>
              <span className="text-zinc-400">{player.style}</span>
            </p>
          </div>

          {/* Base Price Card */}
          <div className="p-3 rounded-xl bg-black/60 border border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
              Starting Base Price
            </span>
            <span className="font-mono text-base font-bold text-zinc-200 tabular-nums">
              {formatLakhsToDisplay(player.basePrice)}
            </span>
          </div>

          {/* Current Leading Team Banner */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              leadingTeam
                ? 'bg-red-950/20 border-red-800/60 ring-1 ring-red-600/30'
                : 'bg-black/40 border-zinc-800/80'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
              Current Paddle Holder
            </span>
            {leadingTeam ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-black text-xs uppercase px-2.5 py-1 rounded-md border ${
                      TEAM_THEMES[leadingTeam.id].bg
                    } ${TEAM_THEMES[leadingTeam.id].text} ${TEAM_THEMES[leadingTeam.id].border}`}
                  >
                    {leadingTeam.id}
                  </span>
                  <div>
                    <span className="font-black text-sm text-white block">
                      {leadingTeam.name}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono font-black text-xs">
                  HOLDING
                </span>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic py-0.5">
                No active bids yet · Player is currently at Base Price
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Price Telemetry & Big Action Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3.5">
          {/* Giant Bid Jumbotron (Black & Red theme with Bolder Current Bid) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black border-2 border-red-900/60 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-2.5 right-3 text-[10px] text-red-400/90 font-mono font-semibold">
              {getIncrementRuleLabel()}
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
              CURRENT BID
            </span>

            {/* Price Numbers: Extra Bold, Larger, High Contrast for viewers */}
            <div className="flex items-center justify-center gap-2 my-2 py-1">
              <span className="text-5xl sm:text-6xl lg:text-7xl font-black font-mono text-white tracking-tight tabular-nums drop-shadow-[0_2px_24px_rgba(239,68,68,0.45)]">
                {formatLakhsToDisplay(currentPrice)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-zinc-400 font-mono mt-1">
              <span>
                Next Minimum Bid:{' '}
                <strong className="text-red-300 font-bold">{formatLakhsToDisplay(nextPrice)}</strong>
              </span>
              <span>·</span>
              <span className="text-zinc-400">+{formatLakhsToDisplay(currentIncrement)} step</span>
            </div>
          </div>

          {/* Action Row: Dimmed Raise Bid Button & Undo Raise Button */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {/* Primary Dimmed Raise Bid Button (Only this raises the price) */}
              <button
                onClick={() => handleIncrementClick(player.currentBidderTeamId as TeamId | undefined)}
                className="sm:col-span-3 py-3.5 px-4 rounded-xl bg-[#381115] hover:bg-[#4a161c] active:bg-[#280c0f] text-red-200 hover:text-white border border-red-900/60 hover:border-red-700/70 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-black/60 transition-all transform active:scale-[0.98] cursor-pointer"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5] text-red-400" />
                <span className="truncate">
                  RAISE BID TO {formatLakhsToDisplay(nextPrice)} (+{formatLakhsToDisplay(currentIncrement)})
                  {leadingTeam ? ` for ${leadingTeam.id}` : ''}
                </span>
              </button>

              {/* Undo Raise Button */}
              <button
                type="button"
                onClick={onUndoRaise}
                disabled={!canUndoRaise}
                className={`py-4 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all select-none ${
                  canUndoRaise
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white cursor-pointer active:scale-95 shadow-md'
                    : 'bg-black/40 border-zinc-900 text-zinc-700 opacity-30 cursor-not-allowed'
                }`}
                title={
                  canUndoRaise
                    ? `Undo misclicked raise (revert to ${formatLakhsToDisplay(previousBidPrice || player.basePrice)})`
                    : 'At base price (nothing to undo)'
                }
              >
                <div className="flex items-center gap-1.5 font-black uppercase text-[11px]">
                  <Undo2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Undo Raise</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {canUndoRaise && previousBidPrice
                    ? `➜ ${formatLakhsToDisplay(previousBidPrice)}`
                    : 'At base'}
                </span>
              </button>
            </div>

            {/* Franchise Paddle Selection: Click sets current paddle holder without raising price */}
            <div className="p-2.5 rounded-xl bg-black/70 border border-zinc-850">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Franchise Paddle: Select Current Paddle Holder
                </span>
                {leadingTeam ? (
                  <span className="text-[10px] font-mono text-red-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Holding Paddle: <strong>{leadingTeam.id}</strong>
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 italic">
                    Click franchise to assign paddle
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {teams.map((t) => {
                  const canAffordCurrent = t.remainingPurse >= currentPrice;
                  const isSelected = player.currentBidderTeamId === t.id;
                  const theme = TEAM_THEMES[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!canAffordCurrent}
                      onClick={() => onSelectPaddleHolder(t.id)}
                      className={`px-1 py-1.5 rounded-lg text-xs font-black uppercase border transition-all flex flex-col items-center justify-center relative select-none ${
                        canAffordCurrent
                          ? `${theme.bg} ${theme.text} ${theme.border} hover:opacity-90 active:scale-95 cursor-pointer shadow-sm`
                          : 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-20'
                      } ${
                        isSelected
                          ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black scale-105 z-10 font-black'
                          : ''
                      }`}
                      title={
                        canAffordCurrent
                          ? isSelected
                            ? `${t.id} currently holds the paddle at ${formatLakhsToDisplay(currentPrice)}`
                            : `Select ${t.id} as current paddle holder at ${formatLakhsToDisplay(currentPrice)}`
                          : 'Insufficient purse balance'
                      }
                    >
                      <span>{t.id}</span>
                      {isSelected && (
                        <span className="text-[8px] font-black uppercase text-red-400 leading-none mt-0.5">
                          HOLD
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row 2: Player Status Controls */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                playUnsoldBuzzer();
                onMarkUnsold();
              }}
              className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
            >
              <span>Mark Player Unsold</span>
            </button>

            <button
              onClick={onNextPlayerClick}
              className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Next Player (Verify Player #{player.code})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
