import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { ShieldCheck, AlertCircle, ArrowRight, X, User } from 'lucide-react';
import { formatLakhsToDisplay } from '../utils/currency';

interface PlayerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingPlayer: Player | null;
  draftPlayers: Player[];
  onVerifyAndReveal: (player: Player) => void;
}

export const PlayerVerificationModal: React.FC<PlayerVerificationModalProps> = ({
  isOpen,
  onClose,
  upcomingPlayer,
  draftPlayers,
  onVerifyAndReveal,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputCode('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || inputCode).trim().padStart(3, '0');
    if (!code) {
      setError('Please enter a 3-digit player code.');
      return;
    }

    const matchedPlayer = draftPlayers.find(
      (p) => p.code.toLowerCase() === code.toLowerCase()
    );

    if (!matchedPlayer) {
      setError(`No pending or unsold player found in pool with code "${code}".`);
      return;
    }

    // Success!
    setError(null);
    onVerifyAndReveal(matchedPlayer);
    onClose();
  };

  const matchedPreview = inputCode.trim()
    ? draftPlayers.find((p) => p.code.toLowerCase() === inputCode.trim().padStart(3, '0').toLowerCase())
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Auctioneer Verification Check
            </h3>
            <p className="text-xs text-slate-400">
              Verify 3-digit player code before revealing next player (Draft & Unsold pool)
            </p>
          </div>
        </div>

        {/* Next in Queue Reference Card */}
        {upcomingPlayer && (
          <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
                {upcomingPlayer.code}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    Next Scheduled Player
                  </span>
                  {upcomingPlayer.status === 'unsold' && (
                    <span className="text-[9px] px-1 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-bold uppercase">
                      UNSOLD
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-white block">
                  {upcomingPlayer.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {upcomingPlayer.role} · Base {formatLakhsToDisplay(upcomingPlayer.basePrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInputCode(upcomingPlayer.code);
                handleVerify(upcomingPlayer.code);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Verify Player #{upcomingPlayer.code}
            </button>
          </div>
        )}

        {/* Verification Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Enter 3-Digit Player Number
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                maxLength={4}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''));
                  setError(null);
                }}
                placeholder="e.g. 104"
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono font-black text-amber-400 tracking-widest placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Matched player live preview */}
          {matchedPreview && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{matchedPreview.name}</span>
                    {matchedPreview.status === 'unsold' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-bold uppercase">
                        UNSOLD (RE-CALL)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {matchedPreview.role} · {matchedPreview.nation}
                  </div>
                </div>
              </div>
              <span className="font-mono font-bold text-amber-300">
                {formatLakhsToDisplay(matchedPreview.basePrice)}
              </span>
            </div>
          )}

          {/* Quick Select from remaining draft and unsold players */}
          {draftPlayers.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Or pick from pending/unsold players ({draftPlayers.length} available):
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {draftPlayers.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setInputCode(p.code);
                      handleVerify(p.code);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-xs flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="font-mono text-amber-400 font-bold">[{p.code}]</span>
                      <span className="truncate">{p.name}</span>
                      {p.status === 'unsold' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-700/60 text-red-300 font-bold uppercase shrink-0">
                          UNSOLD
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {formatLakhsToDisplay(p.basePrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>Verify & Reveal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
