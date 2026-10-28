import React, { useState } from 'react';
import { Player, PlayerRole } from '../types';
import { normalizeCode } from '../utils/csv';
import { UserPlus, X, AlertCircle } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (player: Player) => void;
  existingCodes: string[];
  suggestedCode?: string;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
  existingCodes,
  suggestedCode = '150',
}) => {
  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState('');
  const [nation, setNation] = useState('India');
  const [role, setRole] = useState<PlayerRole>('Batsman');
  const [style, setStyle] = useState('Right-hand bat');
  const [basePrice, setBasePrice] = useState<number>(200); // 200 Lakhs = 2 Cr
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeCode(code);

    if (!cleanCode || cleanCode.length < 3) {
      setError('Player code must be a 3-digit identifier (e.g. 101, 240).');
      return;
    }

    if (existingCodes.includes(cleanCode)) {
      setError(`Code "${cleanCode}" is already assigned to another player.`);
      return;
    }

    if (!name.trim()) {
      setError('Please provide the player name.');
      return;
    }

    if (basePrice <= 0) {
      setError('Base price must be greater than zero.');
      return;
    }

    const newPlayer: Player = {
      id: `custom-p-${Date.now()}`,
      code: cleanCode,
      name: name.trim(),
      nation: nation.trim() || 'International',
      role,
      style: style.trim() || 'Right-hand bat',
      basePrice,
      status: 'draft',
    };

    onAddPlayer(newPlayer);
    onClose();
  };

  const BASE_PRICE_PRESETS = [
    { label: '₹20 L', value: 20 },
    { label: '₹30 L', value: 30 },
    { label: '₹50 L', value: 50 },
    { label: '₹75 L', value: 75 },
    { label: '₹1.00 Cr', value: 100 },
    { label: '₹1.50 Cr', value: 150 },
    { label: '₹2.00 Cr', value: 200 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Add New Player to Draft Pool
            </h3>
            <p className="text-xs text-slate-400">
              Register player with mandatory 3-digit code and auction credentials
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {/* 3-Digit Code */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                3-Digit Code *
              </label>
              <input
                type="text"
                maxLength={3}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                placeholder="101"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold text-center text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Name */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Player Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tilak Varma"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Nation */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Nation *
              </label>
              <input
                type="text"
                value={nation}
                onChange={(e) => setNation(e.target.value)}
                placeholder="India, Australia, etc."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Role / Speciality (Editable Text) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Role / Speciality *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Batsman, Spin All-Rounder, Fast Bowler"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* Playing Style */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Style (Batting / Bowling)
            </label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. Left-hand bat / Right-arm fast medium"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Base Price in Lakhs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Base Price for Auction
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {BASE_PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setBasePrice(preset.value)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                    basePrice === preset.value
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                Custom Lakhs:
              </span>
              <input
                type="number"
                min={10}
                max={5000}
                step={5}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-28 pr-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
            >
              Add to Draft Pool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
