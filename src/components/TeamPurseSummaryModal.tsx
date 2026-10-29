import React, { useState } from 'react';
import { Team, Player, TeamId } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { formatCroresOnly, formatLakhsToDisplay } from '../utils/currency';
import {
  X,
  Users,
  ChevronRight,
  RotateCcw,
  Download,
  Trophy,
  Wallet,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TeamPurseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  allPlayers: Player[];
  isAuctionEnded?: boolean;
  onUndoEndAuction?: () => void;
  onExportCSV?: () => void;
  onOpenEditPurse?: () => void;
}

export const TeamPurseSummaryModal: React.FC<TeamPurseSummaryModalProps> = ({
  isOpen,
  onClose,
  teams,
  allPlayers,
  isAuctionEnded = false,
  onUndoEndAuction,
  onExportCSV,
  onOpenEditPurse,
}) => {
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<TeamId | null>(null);
  // Default to detailed view if auction ended, or let user toggle
  const [isDetailedView, setIsDetailedView] = useState<boolean>(isAuctionEnded);

  React.useEffect(() => {
    if (isAuctionEnded) {
      setIsDetailedView(true);
    }
  }, [isAuctionEnded, isOpen]);

  if (!isOpen) return null;

  const totalStarting = teams.reduce((acc, t) => acc + t.startingPurse, 0);
  const totalRemaining = teams.reduce((acc, t) => acc + t.remainingPurse, 0);
  const totalSpent = totalStarting - totalRemaining;
  const totalPlayersBought = teams.reduce((acc, t) => acc + t.squad.length, 0);
  const soldPlayers = allPlayers.filter((p) => p.status === 'sold');
  const unsoldPlayers = allPlayers.filter((p) => p.status === 'unsold');

  // Find most expensive player
  const highestBuy = soldPlayers.reduce<Player | null>((prev, curr) => {
    const prevPrice = prev?.soldPrice || 0;
    const currPrice = curr.soldPrice || 0;
    return currPrice > prevPrice ? curr : prev;
  }, null);

  // 5 teams on left (0..4), 5 teams on right (5..9)
  const leftTeams = teams.slice(0, 5);
  const rightTeams = teams.slice(5, 10);

  const activeRosterTeam = selectedTeamRoster
    ? teams.find((t) => t.id === selectedTeamRoster)
    : null;
  const activeRosterPlayers = activeRosterTeam
    ? allPlayers.filter((p) => activeRosterTeam.squad.includes(p.id))
    : [];

  const renderCompactTeamCard = (team: Team) => {
    const spent = team.startingPurse - team.remainingPurse;
    const squadCount = team.squad.length;
    const theme = TEAM_THEMES[team.id];
    const spentPercent = Math.min(100, Math.round((spent / team.startingPurse) * 100));

    return (
      <div
        key={team.id}
        className="px-3 py-2 rounded-xl bg-zinc-950/95 border border-zinc-800/80 hover:border-red-900/60 transition-all flex items-center justify-between gap-2 shadow-sm"
      >
        {/* Left: Badge + Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`font-black text-xs px-2 py-0.5 rounded border uppercase shrink-0 ${theme.bg} ${theme.text} ${theme.border}`}
          >
            {team.id}
          </span>
          <div className="min-w-0">
            <span className="font-bold text-xs text-white truncate block">
              {team.name}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block">
              {squadCount}/25 squad
            </span>
          </div>
        </div>

        {/* Right: Remaining Purse + Spent + Squad trigger */}
        <div className="flex items-center gap-2.5 shrink-0 text-right">
          <div>
            <span className="font-mono font-black text-xs sm:text-sm text-red-400 tabular-nums block">
              {formatCroresOnly(team.remainingPurse)}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block">
              {spent > 0 ? `${formatCroresOnly(spent)} spent (${spentPercent}%)` : '₹0 spent'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTeamRoster(selectedTeamRoster === team.id ? null : team.id)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-0.5"
            title="View signed roster"
          >
            <Users className="w-3 h-3 text-red-400" />
            <span>{squadCount}</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDetailedTeamCard = (team: Team) => {
    const spent = team.startingPurse - team.remainingPurse;
    const squadCount = team.squad.length;
    const theme = TEAM_THEMES[team.id];
    const spentPercent = Math.min(100, Math.round((spent / team.startingPurse) * 100));
    const teamPlayers = allPlayers.filter((p) => team.squad.includes(p.id));

    return (
      <div
        key={team.id}
        className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 hover:border-red-800/80 transition-all flex flex-col justify-between shadow-lg"
      >
        <div>
          {/* Top Row: Team Monogram, Name & Squad Size */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`font-black text-xs px-2.5 py-1 rounded-md border uppercase ${theme.bg} ${theme.text} ${theme.border}`}
              >
                {team.id}
              </span>
              <div className="min-w-0">
                <h4 className="font-black text-sm text-white truncate">{team.name}</h4>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {squadCount} / {team.maxSquadSize} Players Signed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTeamRoster(team.id)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Users className="w-3 h-3" />
              <span>Full Squad</span>
            </button>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 gap-2 my-2.5 py-1 bg-black/60 rounded-xl px-3 border border-zinc-900">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Remaining Purse
              </span>
              <span className="font-mono font-black text-sm text-red-400 tabular-nums">
                {formatCroresOnly(team.remainingPurse)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Total Spent
              </span>
              <span className="font-mono font-bold text-xs text-zinc-300 tabular-nums">
                {formatCroresOnly(spent)} ({spentPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden mb-3">
            <div
              className="h-full bg-red-600 transition-all rounded-full"
              style={{ width: `${spentPercent}%` }}
            />
          </div>

          {/* Mini preview of latest signed players */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">
              Top Acquired Players:
            </span>
            {teamPlayers.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic">No players acquired yet.</p>
            ) : (
              teamPlayers.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded bg-black/40 text-zinc-300"
                >
                  <span className="truncate max-w-[140px] font-medium text-white">
                    #{p.code} {p.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-red-400 tabular-nums">
                    {formatLakhsToDisplay(p.soldPrice || 0)}
                  </span>
                </div>
              ))
            )}
            {teamPlayers.length > 3 && (
              <button
                type="button"
                onClick={() => setSelectedTeamRoster(team.id)}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-1 cursor-pointer"
              >
                + {teamPlayers.length - 3} more players...
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const showDetailed = isAuctionEnded || isDetailedView;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div
        className={`bg-black border border-red-950/80 rounded-2xl w-full ${
          showDetailed ? 'max-w-6xl max-h-[94vh]' : 'max-w-4xl'
        } flex flex-col shadow-2xl overflow-hidden transition-all`}
      >
        {/* Modal Header */}
        <div className="px-5 py-3 bg-zinc-950 border-b border-red-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                {isAuctionEnded
                  ? 'SOMUN International Auction · Final Team Purses & Squad Review'
                  : 'Franchise Purse Summary · All 10 Teams'}
              </h2>
              {isAuctionEnded && (
                <span className="text-[10px] font-mono font-bold text-red-400">
                  AUCTION CONCLUDED · OFFICIAL AUDIT
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Detailed vs Compact View */}
            <button
              onClick={() => setIsDetailedView(!isDetailedView)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle detailed wide squad review"
            >
              {showDetailed ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Compact View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Detailed View</span>
                </>
              )}
            </button>

            {/* Change Team Purses Button */}
            {onOpenEditPurse && (
              <button
                onClick={onOpenEditPurse}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Change team purse balances or starting funds"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Change Purses</span>
              </button>
            )}

            {/* Undo End Auction (Resume Auction) button */}
            {isAuctionEnded && onUndoEndAuction && (
              <button
                onClick={() => {
                  onUndoEndAuction();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Resume the auction and allow further bidding"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo End Auction</span>
              </button>
            )}

            {/* Export CSV Report */}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download complete auction report as CSV"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Key Metrics Banner (Visible in both views, enhanced in detailed view) */}
        <div className="px-5 py-2.5 bg-zinc-950/80 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-zinc-400">
              Total Starting:{' '}
              <strong className="text-white">{formatCroresOnly(totalStarting)}</strong>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">
              Total Spent:{' '}
              <strong className="text-red-400">{formatCroresOnly(totalSpent)}</strong>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">
              Remaining:{' '}
              <strong className="text-zinc-200">{formatCroresOnly(totalRemaining)}</strong>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">
              Signed:{' '}
              <strong className="text-red-400">{totalPlayersBought} players</strong>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">
              Unsold: <strong className="text-zinc-400">{unsoldPlayers.length}</strong>
            </span>
          </div>

          {highestBuy && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-sans">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Buy:</span>
              <strong className="text-white font-bold">{highestBuy.name}</strong>
              <span className="font-mono text-red-400 font-black">
                ({formatLakhsToDisplay(highestBuy.soldPrice || 0)} ➜ {highestBuy.soldTo})
              </span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {showDetailed ? (
            /* WIDER AND DETAILED VIEW: All 10 Teams with Detailed Financials & Acquired Rosters */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3.5">
              {teams.map((team) => renderDetailedTeamCard(team))}
            </div>
          ) : (
            /* COMPACT 5-and-5 VIEW: Strictly 5 Teams Left and 5 Teams Right */
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {leftTeams.map((team) => renderCompactTeamCard(team))}
              </div>
              <div className="space-y-1.5">
                {rightTeams.map((team) => renderCompactTeamCard(team))}
              </div>
            </div>
          )}
        </div>

        {/* Popping-up Modal with Vertical Player List */}
        {activeRosterTeam && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer"
            onClick={() => setSelectedTeamRoster(null)}
          >
            <div
              className="bg-zinc-950 border-2 border-red-800/80 rounded-2xl w-full max-w-xl p-5 shadow-2xl relative cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black text-sm px-2.5 py-1 rounded border uppercase ${
                      TEAM_THEMES[activeRosterTeam.id].bg
                    } ${TEAM_THEMES[activeRosterTeam.id].text} ${TEAM_THEMES[activeRosterTeam.id].border}`}
                  >
                    {activeRosterTeam.id}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {activeRosterTeam.name} · Acquired Squad
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {activeRosterPlayers.length} / 25 Players Signed · Remaining Purse:{' '}
                      <strong className="text-red-400 font-mono">
                        {formatCroresOnly(activeRosterTeam.remainingPurse)}
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeamRoster(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vertical Player List - Strictly one player below the other */}
              <div className="py-3">
                {activeRosterPlayers.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm italic bg-black/40 rounded-xl border border-zinc-900">
                    No players acquired yet by {activeRosterTeam.name} in this auction.
                  </div>
                ) : (
                  <div className="max-h-[58vh] overflow-y-auto pr-1.5 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {activeRosterPlayers.map((p, idx) => (
                      <div
                        key={p.id}
                        className="px-3.5 py-2.5 rounded-xl bg-black/80 border border-zinc-800/80 hover:border-red-600/70 transition-all flex items-center justify-between gap-3 shadow-sm group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-zinc-500 w-5 shrink-0 text-right">
                            {idx + 1}.
                          </span>
                          <span className="font-mono text-[11px] font-black text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-900/40 shrink-0">
                            #{p.code}
                          </span>
                          <div className="min-w-0">
                            <span
                              className="font-bold text-sm text-white truncate block group-hover:text-red-300 transition-colors"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="text-xs text-zinc-400 truncate block">
                              {p.role} · {p.nation}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-zinc-500 block uppercase font-medium">
                            Sold Price
                          </span>
                          <span className="font-mono font-black text-sm text-red-400 tabular-nums block">
                            {formatLakhsToDisplay(p.soldPrice || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popup Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs text-zinc-500">
                <span>{activeRosterPlayers.length} / 25 Squad Members Acquired</span>
                <button
                  onClick={() => setSelectedTeamRoster(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-black border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>
            {showDetailed
              ? 'Wider & Detailed View · Comprehensive Team Audits'
              : '5 Franchises Left · 5 Franchises Right · Real-Time Balance'}
          </span>
          <div className="flex items-center gap-2">
            {isAuctionEnded && onUndoEndAuction && (
              <button
                onClick={onUndoEndAuction}
                className="px-3 py-1 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 border border-red-800"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo End Auction</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold transition-colors cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
