import React, { useEffect, useRef } from 'react';
import { BidRecord, TeamId } from '../types';
import { TEAM_THEMES } from '../data/teams';
import { formatLakhsToDisplay } from '../utils/currency';
import { Clock, History, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface BiddingFeedProps {
  bids: BidRecord[];
  activePlayerCode?: string;
  activePlayerName?: string;
}

export const BiddingFeed: React.FC<BiddingFeedProps> = ({ bids, activePlayerName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Strictly filter only sold and unsold events, with the latest news at the top
  const soldUnsoldEvents = bids.filter((b) => b.type === 'sold' || b.type === 'unsold');
  const recentBids = [...soldUnsoldEvents].reverse().slice(0, 6);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [recentBids]);

  return (
    <div className="flex flex-col h-full min-h-[480px] bg-zinc-950/90 backdrop-blur-xl rounded-2xl border border-red-950/60 overflow-hidden shadow-2xl">
      {/* Feed Header (Black & Red) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black/95 border-b border-red-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-200">
            Live Bidding Feed
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-[10px] font-semibold tabular-nums text-zinc-400">
            {recentBids.length > 0 ? `Last ${recentBids.length} Outcomes` : '0 events'}
          </span>
        </div>
      </div>

      {/* Scrolling Content (Fixed block with max 6 sold/unsold events, no timestamps) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {recentBids.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600">
            <Clock className="w-6 h-6 mb-1.5 opacity-40 text-red-500/50" />
            <p className="text-xs font-semibold text-zinc-400">Sold and unsold player outcomes will appear here.</p>
            {activePlayerName && (
              <p className="text-[10px] text-zinc-500 mt-0.5">Player on block: {activePlayerName}</p>
            )}
          </div>
        ) : (
          recentBids.map((b, idx) => {
            const isLatest = idx === 0;
            const isSold = b.type === 'sold';
            const isUnsold = b.type === 'unsold';

            const bgClass = isSold
              ? isLatest
                ? 'bg-red-950/60 border-red-600/90 shadow-md ring-1 ring-red-500/40'
                : 'bg-red-950/40 border-red-800/60 shadow-sm'
              : isLatest
                ? 'bg-zinc-900/90 border-zinc-700 shadow-md ring-1 ring-zinc-700'
                : 'bg-zinc-900/60 border-zinc-800';

            const teamTheme = b.teamId && TEAM_THEMES[b.teamId as TeamId] ? TEAM_THEMES[b.teamId as TeamId] : null;

            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${bgClass} flex items-start gap-2.5 relative`}
              >
                {/* Team Badge or Outcome Icon */}
                <div className="shrink-0 mt-0.5">
                  {teamTheme && b.teamId ? (
                    <span
                      className={`inline-block font-black text-[10px] px-2 py-0.5 rounded border ${teamTheme.bg} ${teamTheme.text} ${teamTheme.border}`}
                    >
                      {b.teamId}
                    </span>
                  ) : isSold ? (
                    <div className="w-6 h-6 rounded-lg bg-red-950 text-red-400 border border-red-800 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center justify-center">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Event Details (No timestamps as requested) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-white truncate text-[11px] tracking-wide uppercase">
                        {isSold ? (b.teamId ? `SOLD TO ${b.teamId}` : 'SOLD') : 'UNSOLD'}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          Latest
                        </span>
                      )}
                    </div>
                    {b.price > 0 && isSold && (
                      <span className="font-mono font-black text-red-400 text-xs tabular-nums shrink-0">
                        {formatLakhsToDisplay(b.price)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-300 leading-snug">{b.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
