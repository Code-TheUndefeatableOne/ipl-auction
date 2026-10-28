import React from 'react';
import { Team, TeamId, Player } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { formatCroresOnly, formatLakhsToDisplay } from '../utils/currency';
import { Check, AlertCircle } from 'lucide-react';

interface BottomTeamDockProps {
  teams: Team[];
  activePlayer: Player | null;
  currentBid: number; // in Lakhs
  allPlayers: Player[];
  onSellToTeam: (teamId: TeamId) => void;
}

export const BottomTeamDock: React.FC<BottomTeamDockProps> = ({
  teams,
  activePlayer,
  currentBid,
  onSellToTeam,
}) => {
  const isAuctionActive = Boolean(activePlayer && activePlayer.status === 'in_auction');

  return (
    <div className="bg-black/95 backdrop-blur-xl border-t border-red-950/60 shadow-2xl px-3 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Title bar without hammer logo and without 'click franchise to hammer and sell' */}
        <div className="flex items-center justify-between mb-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-red-500 tracking-wider uppercase text-[11px]">
              Franchise Paddle Board
            </span>
            {isAuctionActive && (
              <span className="text-[11px] text-zinc-400 font-mono">
                · Current Bid: <strong className="text-red-400">{formatLakhsToDisplay(currentBid)}</strong>
              </span>
            )}
          </div>
          {activePlayer && (
            <div className="text-[11px] text-red-400 font-mono font-bold hidden sm:block">
              Player #{activePlayer.code} · {activePlayer.name} ({activePlayer.role})
            </div>
          )}
        </div>

        {/* 10 Team Interactive Buttons with Dimmed Franchise Theme Colors (No Logos) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {teams.map((team) => {
            const squadCount = team.squad.length;
            const theme = TEAM_THEMES[team.id];
            const cannotAfford = team.remainingPurse < currentBid;
            const isSquadFull = squadCount >= team.maxSquadSize;

            const isDisabled = !isAuctionActive || cannotAfford || isSquadFull;

            let disabledReason = '';
            if (!isAuctionActive) disabledReason = 'No active player';
            else if (cannotAfford) disabledReason = 'Purse exceeded';
            else if (isSquadFull) disabledReason = 'Squad full (25)';

            const isLeadingBidder = activePlayer?.currentBidderTeamId === team.id;

            return (
              <button
                key={team.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onSellToTeam(team.id)}
                title={
                  isDisabled
                    ? `${team.name}: ${disabledReason}`
                    : `Sell to ${team.name} for ${formatLakhsToDisplay(currentBid)}`
                }
                className={`relative group rounded-xl p-2.5 text-center border transition-all flex flex-col items-center justify-between min-h-[92px] select-none shadow-md ${
                  isDisabled
                    ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 opacity-30 cursor-not-allowed'
                    : `${theme.bg} ${theme.hoverBg} ${theme.text} ${theme.border} cursor-pointer hover:scale-[1.03] active:scale-95 ${theme.glow}`
                } ${
                  isLeadingBidder && !isDisabled
                    ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black scale-[1.03]'
                    : ''
                }`}
              >
                {/* Leading paddle indicator */}
                {isLeadingBidder && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black text-red-400 border border-red-500 text-[9px] font-black uppercase tracking-widest shadow-md">
                    LEAD
                  </span>
                )}

                {/* Team Monogram Badge (Pure Typography) */}
                <div className="flex items-center justify-center w-full">
                  <span
                    className={`font-black text-sm tracking-wider uppercase px-2 py-0.5 rounded-md ${
                      isDisabled
                        ? 'bg-zinc-900 text-zinc-600'
                        : `${theme.badgeBg} ${theme.badgeText}`
                    }`}
                  >
                    {team.id}
                  </span>
                </div>

                {/* Team Remaining Purse */}
                <div className="my-1 w-full">
                  <span
                    className={`font-mono text-xs font-bold tabular-nums block ${
                      isDisabled ? 'text-zinc-600' : 'text-zinc-200 drop-shadow-sm'
                    }`}
                  >
                    {formatCroresOnly(team.remainingPurse)}
                  </span>
                </div>

                {/* Squad Count & Status */}
                <div className="w-full">
                  <span
                    className={`text-[10px] font-mono font-medium block ${
                      isDisabled ? 'text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {squadCount}/25 sq
                  </span>
                </div>

                {/* Action Hover Overlay */}
                {!isDisabled && (
                  <div className="absolute inset-0 rounded-xl bg-black/95 text-red-400 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1.5 z-10 border border-red-600">
                    <Check className="w-5 h-5 text-red-400 stroke-[3] mb-0.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      SELL TO {team.id}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-red-300">
                      {formatLakhsToDisplay(currentBid)}
                    </span>
                  </div>
                )}

                {/* Disabled Tag */}
                {isDisabled && isAuctionActive && (
                  <div className="mt-0.5 flex items-center justify-center gap-0.5 text-[9px] text-red-400/80 leading-tight w-full truncate">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{disabledReason}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
