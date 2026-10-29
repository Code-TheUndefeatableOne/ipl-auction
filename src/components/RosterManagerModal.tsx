import React, { useState, useRef } from 'react';
import { Player, PlayerRole, PlayerStatus, TeamId } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { exportPlayersToCSV, parseCSVToPlayers, downloadSampleCSVTemplate } from '../utils/csv';
import { formatLakhsToDisplay } from '../utils/currency';
import {
  X,
  Search,
  Download,
  Upload,
  UserPlus,
  Play,
  Trash2,
  Users,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface RosterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayerClick: () => void;
  onPutOnBlock: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onBulkUpdatePlayers: (newPlayers: Player[]) => void;
}

export const RosterManagerModal: React.FC<RosterManagerModalProps> = ({
  isOpen,
  onClose,
  players,
  onAddPlayerClick,
  onPutOnBlock,
  onDeletePlayer,
  onBulkUpdatePlayers,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PlayerStatus>('All');
  const [nationFilter, setNationFilter] = useState<string>('All');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { players: imported, errors } = parseCSVToPlayers(text);

      if (errors.length > 0 && imported.length === 0) {
        setUploadMessage({ type: 'error', text: errors[0] });
        return;
      }

      if (imported.length > 0) {
        onBulkUpdatePlayers(imported);
        setUploadMessage({
          type: 'success',
          text: `Successfully loaded ${imported.length} players from CSV! ${
            errors.length > 0 ? `(${errors.length} warnings)` : ''
          }`,
        });
      }
    };
    reader.onerror = () => {
      setUploadMessage({ type: 'error', text: 'Failed to read CSV file.' });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.nation.toLowerCase().includes(search.toLowerCase()) ||
      p.style.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesNation = nationFilter === 'All' || p.nation === nationFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesNation;
  });

  const totalSold = players.filter((p) => p.status === 'sold').length;
  const totalDraft = players.filter((p) => p.status === 'draft').length;
  const totalUnsold = players.filter((p) => p.status === 'unsold').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Player Pool & Roster Management
              </h2>
              <p className="text-xs text-slate-400">
                Filter, upload/download CSV rosters, and queue players for the live auction block
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & CSV Actions */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>
              Total: <strong className="text-white">{players.length}</strong>
            </span>
            <span>·</span>
            <span>
              Draft: <strong className="text-amber-400">{totalDraft}</strong>
            </span>
            <span>·</span>
            <span>
              Sold: <strong className="text-emerald-400">{totalSold}</strong>
            </span>
            <span>·</span>
            <span>
              Unsold: <strong className="text-rose-400">{totalUnsold}</strong>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddPlayerClick}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Player</span>
            </button>

            <button
              onClick={() => exportPlayersToCSV(players)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={downloadSampleCSVTemplate}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-800 cursor-pointer"
              title="Download sample CSV template"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>
          </div>
        </div>

        {/* Upload Feedback Toast */}
        {uploadMessage && (
          <div
            className={`mx-6 mt-3 p-3 rounded-lg text-xs flex items-center justify-between ${
              uploadMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
            <button
              onClick={() => setUploadMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, nation, style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Roles / Specialities</option>
              {Array.from(new Set(players.map((p) => p.role).filter(Boolean))).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              <option value="draft">Draft Pool</option>
              <option value="in_auction">In Auction</option>
              <option value="sold">Sold</option>
              <option value="unsold">Unsold</option>
            </select>

            <select
              value={nationFilter}
              onChange={(e) => setNationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Nations</option>
              {Array.from(new Set(players.map((p) => p.nation).filter(Boolean))).map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Players Data Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-4">Player</th>
                  <th className="py-2.5 px-3">Nation</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Style</th>
                  <th className="py-2.5 px-3 text-right">Base Price</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Auction Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No players match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => {
                    const isSold = player.status === 'sold';
                    const isInAuction = player.status === 'in_auction';
                    const isUnsold = player.status === 'unsold';
                    const teamTheme =
                      player.soldTo && TEAM_THEMES[player.soldTo as TeamId]
                        ? TEAM_THEMES[player.soldTo as TeamId]
                        : null;

                    return (
                      <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          #{player.code}
                        </td>

                        <td className="py-2.5 px-4">
                          <span className="font-bold text-white text-xs block">
                            {player.name}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-300 font-medium">
                          <span>{player.nation}</span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-300">
                          {player.role}
                        </td>

                        <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate" title={player.style}>
                          {player.style}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 tabular-nums">
                          {formatLakhsToDisplay(player.basePrice)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {isSold ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs">
                              {teamTheme && player.soldTo && (
                                <span
                                  className={`font-black text-[10px] px-1.5 py-0.2 rounded ${teamTheme.bg} ${teamTheme.text}`}
                                >
                                  {player.soldTo}
                                </span>
                              )}
                              <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                                {formatLakhsToDisplay(player.soldPrice || 0)}
                              </span>
                            </div>
                          ) : isInAuction ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                              Live on Block
                            </span>
                          ) : isUnsold ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[11px]">
                              Unsold
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSold && !isInAuction && (
                              <button
                                onClick={() => {
                                  onPutOnBlock(player);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Put player onto live auction block"
                              >
                                <Play className="w-3 h-3" />
                                <span>Draft</span>
                              </button>
                            )}

                            {!isSold && (
                              <button
                                onClick={() => onDeletePlayer(player.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Remove player from pool"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong className="text-white">{filteredPlayers.length}</strong> of {players.length} players
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
