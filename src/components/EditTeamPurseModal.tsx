import React, { useState, useEffect } from 'react';
import { Team, Player, TeamId } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { formatCroresOnly } from '../utils/currency';
import {
  X,
  Wallet,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface EditTeamPurseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  allPlayers: Player[];
  onSavePurses: (updatedTeams: Team[]) => void;
}

export const EditTeamPurseModal: React.FC<EditTeamPurseModalProps> = ({
  isOpen,
  onClose,
  teams,
  allPlayers,
  onSavePurses,
}) => {
  // Map of teamId -> starting purse in Crores (as string to allow fluid typing)
  const [startingPurses, setStartingPurses] = useState<Record<TeamId, string>>({} as any);
  // Optional override for remaining purse (if user wants to customize remaining directly)
  const [remainingPurses, setRemainingPurses] = useState<Record<TeamId, string>>({} as any);
  // Auto-calc remaining purse from (starting - spent)
  const [autoDeductSpent, setAutoDeductSpent] = useState<boolean>(true);
  // Global preset custom input
  const [bulkCrores, setBulkCrores] = useState<string>('120');

  // Pre-calculate spent per team from actual sold players
  const teamSpentMap = React.useMemo(() => {
    const map: Record<TeamId, number> = {} as any;
    teams.forEach((t) => {
      const squadPlayers = allPlayers.filter((p) => t.squad.includes(p.id));
      const spent = squadPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      map[t.id] = spent; // in Lakhs
    });
    return map;
  }, [teams, allPlayers]);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      const startInit: Record<TeamId, string> = {} as any;
      const remInit: Record<TeamId, string> = {} as any;

      teams.forEach((t) => {
        // Convert Lakhs to Crores string
        startInit[t.id] = (t.startingPurse / 100).toString();
        remInit[t.id] = (t.remainingPurse / 100).toString();
      });

      setStartingPurses(startInit);
      setRemainingPurses(remInit);
      setAutoDeductSpent(true);
    }
  }, [isOpen, teams]);

  if (!isOpen) return null;

  const handleStartingPurseChange = (teamId: TeamId, valueStr: string) => {
    setStartingPurses((prev) => ({
      ...prev,
      [teamId]: valueStr,
    }));

    if (autoDeductSpent) {
      const parsedCr = parseFloat(valueStr);
      if (!isNaN(parsedCr) && parsedCr >= 0) {
        const newStartLakhs = Math.round(parsedCr * 100);
        const spentLakhs = teamSpentMap[teamId] || 0;
        const newRemLakhs = Math.max(0, newStartLakhs - spentLakhs);
        setRemainingPurses((prev) => ({
          ...prev,
          [teamId]: (newRemLakhs / 100).toString(),
        }));
      }
    }
  };

  const handleRemainingPurseChange = (teamId: TeamId, valueStr: string) => {
    setRemainingPurses((prev) => ({
      ...prev,
      [teamId]: valueStr,
    }));
  };

  // Bulk set all teams to a specific Crores value
  const handleApplyBulk = (croresValue: number) => {
    const startUpdated: Record<TeamId, string> = {} as any;
    const remUpdated: Record<TeamId, string> = {} as any;

    teams.forEach((t) => {
      startUpdated[t.id] = croresValue.toString();
      if (autoDeductSpent) {
        const startLakhs = Math.round(croresValue * 100);
        const spentLakhs = teamSpentMap[t.id] || 0;
        const remLakhs = Math.max(0, startLakhs - spentLakhs);
        remUpdated[t.id] = (remLakhs / 100).toString();
      } else {
        remUpdated[t.id] = croresValue.toString();
      }
    });

    setStartingPurses(startUpdated);
    setRemainingPurses(remUpdated);
  };

  const handleResetToDefault = () => {
    handleApplyBulk(120);
  };

  const handleSave = () => {
    const updatedTeams: Team[] = teams.map((team) => {
      const startCr = parseFloat(startingPurses[team.id]);
      const remCr = parseFloat(remainingPurses[team.id]);

      const validStartCr = !isNaN(startCr) && startCr >= 0 ? startCr : team.startingPurse / 100;
      const validStartLakhs = Math.round(validStartCr * 100);

      let finalRemLakhs: number;
      if (autoDeductSpent) {
        const spent = teamSpentMap[team.id] || 0;
        finalRemLakhs = Math.max(0, validStartLakhs - spent);
      } else {
        const parsedRemLakhs = !isNaN(remCr) && remCr >= 0 ? Math.round(remCr * 100) : validStartLakhs;
        finalRemLakhs = parsedRemLakhs;
      }

      return {
        ...team,
        startingPurse: validStartLakhs,
        remainingPurse: finalRemLakhs,
      };
    });

    onSavePurses(updatedTeams);
    onClose();
  };

  const leftTeams = teams.slice(0, 5);
  const rightTeams = teams.slice(5, 10);

  const renderTeamEditRow = (team: Team) => {
    const theme = TEAM_THEMES[team.id];
    const spentLakhs = teamSpentMap[team.id] || 0;
    const currentStartCr = parseFloat(startingPurses[team.id]) || 0;
    const currentRemCr = parseFloat(remainingPurses[team.id]) || 0;
    const isDeficit = currentStartCr * 100 < spentLakhs;

    return (
      <div
        key={team.id}
        className={`p-3 rounded-xl bg-zinc-950/90 border transition-all ${
          isDeficit ? 'border-red-600/80' : 'border-zinc-850 hover:border-red-950'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
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
                {team.squad.length} players acquired · {formatCroresOnly(spentLakhs)} spent
              </span>
            </div>
          </div>

          {/* Quick reset team to 120 Cr */}
          <button
            type="button"
            onClick={() => handleStartingPurseChange(team.id, '120')}
            className="text-[10px] text-zinc-500 hover:text-red-400 font-mono transition-colors shrink-0"
            title="Reset this team to ₹120 Cr"
          >
            Reset ₹120Cr
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2">
          {/* Starting Purse Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Starting Purse (₹ Cr)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="1000"
                value={startingPurses[team.id] ?? ''}
                onChange={(e) => handleStartingPurseChange(team.id, e.target.value)}
                className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-white font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 pr-8 outline-none transition-all"
                placeholder="120"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
                Cr
              </span>
            </div>
          </div>

          {/* Remaining Purse Display / Editable */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Remaining Purse
              </label>
              {autoDeductSpent && (
                <span className="text-[9px] text-red-400 font-mono uppercase">
                  Auto-Calc
                </span>
              )}
            </div>
            {autoDeductSpent ? (
              <div
                className={`w-full bg-zinc-900/80 border rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs flex items-center justify-between ${
                  isDeficit ? 'border-red-600 text-red-400' : 'border-zinc-800 text-red-300'
                }`}
              >
                <span>₹{currentRemCr.toFixed(2)} Cr</span>
                {isDeficit && (
                  <span className="text-[9px] bg-red-950 text-red-300 px-1 rounded border border-red-800">
                    Deficit
                  </span>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="1000"
                  value={remainingPurses[team.id] ?? ''}
                  onChange={(e) => handleRemainingPurseChange(team.id, e.target.value)}
                  className="w-full bg-black border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-red-300 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5 pr-8 outline-none transition-all"
                  placeholder="120"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
                  Cr
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-black border border-red-950/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-zinc-950 border-b border-red-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Change Team Purses & Auction Budgets
              </h2>
              <span className="text-[11px] text-zinc-400">
                Adjust starting funds, retention deductions, or custom balances for all 10 franchises
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Close purse editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk Presets & Global Adjustments Banner */}
        <div className="px-5 py-3 bg-zinc-950/70 border-b border-zinc-900 shrink-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                Quick Set All Teams:
              </span>
              {[90, 100, 110, 120, 130, 140, 150].map((cr) => (
                <button
                  key={cr}
                  type="button"
                  onClick={() => handleApplyBulk(cr)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 text-zinc-300 border border-zinc-800 font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  ₹{cr} Cr
                </button>
              ))}
            </div>

            {/* Custom bulk input */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-24">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={bulkCrores}
                  onChange={(e) => setBulkCrores(e.target.value)}
                  className="w-full bg-black border border-zinc-800 focus:border-red-600 text-white font-mono font-bold text-xs rounded-lg px-2.5 py-1 pr-7 outline-none"
                  placeholder="120"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
                  Cr
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(bulkCrores);
                  if (!isNaN(val) && val > 0) handleApplyBulk(val);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Apply All
              </button>
            </div>
          </div>

          {/* Settings Toggle: Auto deduct spent */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-900/60 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300">
              <input
                type="checkbox"
                checked={autoDeductSpent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoDeductSpent(checked);
                  if (checked) {
                    // recompute remaining purses
                    const remUpdated: Record<TeamId, string> = {} as any;
                    teams.forEach((t) => {
                      const startCr = parseFloat(startingPurses[t.id]) || t.startingPurse / 100;
                      const spentLakhs = teamSpentMap[t.id] || 0;
                      const remLakhs = Math.max(0, Math.round(startCr * 100) - spentLakhs);
                      remUpdated[t.id] = (remLakhs / 100).toString();
                    });
                    setRemainingPurses(remUpdated);
                  }
                }}
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-red-600 focus:ring-offset-black accent-red-600 cursor-pointer"
              />
              <span className="text-[11px] font-medium">
                Automatically calculate Remaining Purse (<span className="text-white font-mono">Starting Purse - Spent on Squad</span>)
              </span>
            </label>

            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              1 Crore = 100 Lakhs
            </span>
          </div>
        </div>

        {/* 10 Teams Edit Grid - 5 on left, 5 on right */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Left 5 Teams */}
            <div className="space-y-3">
              <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Franchises 1 — 5
              </div>
              {leftTeams.map(renderTeamEditRow)}
            </div>

            {/* Right 5 Teams */}
            <div className="space-y-3">
              <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Franchises 6 — 10
              </div>
              {rightTeams.map(renderTeamEditRow)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-red-950/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Reset All to ₹120 Cr</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 hover:shadow-red-700/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Team Purses</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
