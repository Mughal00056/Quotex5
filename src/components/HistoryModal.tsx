import React, { useState, useMemo, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Trash2,
  Wallet,
  FileText,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'trades' | 'deposits' | 'withdrawals' | 'stats';
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

type HistoryTab = 'ALL_TRANSACTIONS' | 'DEPOSITS' | 'WITHDRAWALS' | 'TRADES';
type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  defaultTab,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const {
    realBalance = 0,
    tradeHistory = [],
    deposits = [],
    withdrawals = [],
    approveWithdrawal,
    removeDepositFromHistory,
    removeWithdrawalFromHistory,
    removeTradeFromHistory,
    clearAllHistory,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<HistoryTab>('ALL_TRANSACTIONS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultTab === 'deposits') setActiveTab('DEPOSITS');
    else if (defaultTab === 'withdrawals') setActiveTab('WITHDRAWALS');
    else if (defaultTab === 'trades') setActiveTab('TRADES');
    else setActiveTab('ALL_TRANSACTIONS');
  }, [isOpen, defaultTab]);

  const financialStats = useMemo(() => {
    const totalDeposited = deposits
      .filter((d) => d.status === 'APPROVED')
      .reduce((acc, d) => acc + d.totalCredited, 0);

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((acc, w) => acc + w.amount, 0);

    return {
      totalDeposited: Number(totalDeposited.toFixed(2)),
      totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
    };
  }, [deposits, withdrawals]);

  // Unified chronological ledger of Deposits + Withdrawals
  const unifiedLedger = useMemo(() => {
    const depItems = deposits.map((d) => ({
      kind: 'DEPOSIT' as const,
      id: d.id,
      refId: d.txHash || d.id,
      amount: d.amount,
      bonusAmount: d.bonusAmount,
      netAmount: d.totalCredited,
      method: d.method,
      network: d.network || 'Instant Verified Gateway',
      details: d.senderDetails || 'Verified Merchant Deposit',
      status: d.status === 'APPROVED' ? 'APPROVED' : d.status,
      createdAt: d.createdAt,
      balanceAfter: d.balanceAfter,
    }));

    const wdItems = withdrawals.map((w) => ({
      kind: 'WITHDRAWAL' as const,
      id: w.id,
      refId: w.txId || w.id,
      amount: w.amount,
      bonusAmount: 0,
      netAmount: w.amount,
      method: w.method,
      network: 'Verified Payout Gateway',
      details: w.destinationAccount,
      accountHolderName: w.accountHolderName,
      status: w.status === 'PROCESSING' ? 'PENDING' : w.status,
      createdAt: w.createdAt,
      balanceAfter: w.balanceAfter,
    }));

    const combined = [...depItems, ...wdItems].sort((a, b) => b.createdAt - a.createdAt);

    return combined.filter((item) => {
      if (activeTab === 'DEPOSITS' && item.kind !== 'DEPOSIT') return false;
      if (activeTab === 'WITHDRAWALS' && item.kind !== 'WITHDRAWAL') return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.method.toLowerCase().includes(q) ||
          item.refId.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.details || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deposits, withdrawals, activeTab, statusFilter, searchQuery]);

  const filteredTrades = useMemo(() => {
    if (!searchQuery.trim()) return tradeHistory;
    const q = searchQuery.toLowerCase();
    return tradeHistory.filter(
      (t) =>
        t.assetName.toLowerCase().includes(q) ||
        t.direction.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [tradeHistory, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141722] border border-[#23293a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#23293a] bg-[#181c29] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/15 border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                  TRANSACTION & LEDGER HISTORY
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#00b85c]/20 text-[#00b85c] border border-[#00b85c]/30">
                  LIVE SYNCED
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Official Deposit, Withdrawal & Closed Trade Records
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#00b85c] hover:bg-[#00d66c] text-slate-950 text-[11px] font-black flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Deposit</span>
              </button>
            )}
            {onOpenWithdraw && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWithdraw();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#1e2436] hover:bg-[#262d42] border border-[#2b3247] text-[11px] font-bold text-white flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#ff5252]" />
                <span>Withdraw</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#8b949e] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards Bar */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-[#10131c] border-b border-[#23293a] shrink-0">
          <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-2.5">
            <div className="text-[9px] uppercase font-black tracking-wider text-[#8b949e]">
              Live Balance
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white mt-0.5">
              ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-2.5">
            <div className="text-[9px] uppercase font-black tracking-wider text-[#8b949e]">
              Total Deposited ({deposits.length})
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-[#00b85c] mt-0.5">
              +${financialStats.totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-2.5">
            <div className="text-[9px] uppercase font-black tracking-wider text-[#8b949e]">
              Total Withdrawn ({withdrawals.length})
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-[#ff5252] mt-0.5">
              -${financialStats.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Filter Bar */}
        <div className="px-4 py-2.5 bg-[#161a26] border-b border-[#23293a] space-y-2.5 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 bg-[#10131c] p-1 rounded-xl border border-[#23293a]">
            <button
              onClick={() => setActiveTab('ALL_TRANSACTIONS')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'ALL_TRANSACTIONS'
                  ? 'bg-[#2563eb] text-white shadow'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              All Cashier ({deposits.length + withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab('DEPOSITS')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'DEPOSITS'
                  ? 'bg-[#00b85c] text-slate-950 shadow'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Deposits ({deposits.length})
            </button>
            <button
              onClick={() => setActiveTab('WITHDRAWALS')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'WITHDRAWALS'
                  ? 'bg-[#ff5252] text-white shadow'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Withdrawals ({withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab('TRADES')}
              className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                activeTab === 'TRADES'
                  ? 'bg-[#6366f1] text-white shadow'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Trades ({tradeHistory.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Reference ID, payment method, wallet or asset..."
                className="w-full bg-[#10131c] border border-[#23293a] focus:border-[#3b82f6] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            {activeTab !== 'TRADES' ? (
              <div className="flex items-center space-x-1">
                {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as StatusFilter[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#23293a] text-white border border-[#3b82f6]/50'
                        : 'bg-[#10131c] text-[#8b949e] hover:text-white border border-[#23293a]'
                    }`}
                  >
                    {st === 'APPROVED' ? 'COMPLETED' : st}
                  </button>
                ))}
              </div>
            ) : (
              tradeHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-2.5 py-1 rounded-lg bg-[#ff3d3d]/15 hover:bg-[#ff3d3d]/25 text-[#ff5252] text-[10px] font-black flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Main Scrollable Records List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 custom-scrollbar">
          {activeTab !== 'TRADES' ? (
            unifiedLedger.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#181c29] border border-[#23293a] flex items-center justify-center mx-auto text-[#8b949e]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">No Transaction Records Found</div>
                <p className="text-xs text-[#8b949e] max-w-xs mx-auto">
                  All deposits and withdrawals you make in the Cashier are automatically synchronized here in real time.
                </p>
              </div>
            ) : (
              unifiedLedger.map((item) => {
                const isDeposit = item.kind === 'DEPOSIT';
                const isExpanded = expandedReceiptId === item.id;
                const isCompleted = item.status === 'APPROVED';
                const statusColor = isCompleted
                  ? 'text-[#00b85c] bg-[#00b85c]/15 border-[#00b85c]/30'
                  : item.status === 'PENDING'
                  ? 'text-[#f59e0b] bg-[#f59e0b]/15 border-[#f59e0b]/30'
                  : 'text-[#ff3d3d] bg-[#ff3d3d]/15 border-[#ff3d3d]/30';

                return (
                  <div
                    key={item.id}
                    className="bg-[#181c29] border border-[#23293a] hover:border-[#323a52] rounded-xl overflow-hidden transition-all"
                  >
                    {/* Main Row */}
                    <div
                      onClick={() => setExpandedReceiptId(isExpanded ? null : item.id)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDeposit
                              ? 'bg-[#00b85c]/15 border-[#00b85c]/40 text-[#00b85c]'
                              : 'bg-[#ff5252]/15 border-[#ff5252]/40 text-[#ff5252]'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isDeposit
                                  ? 'bg-[#00b85c]/20 text-[#00b85c]'
                                  : 'bg-[#ff5252]/20 text-[#ff5252]'
                              }`}
                            >
                              {isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-white truncate">
                              {item.method}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#8b949e] mt-0.5">
                            <span className="font-mono text-[#c9d1d9]">{item.refId}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-sm sm:text-base font-mono font-black ${
                              isDeposit ? 'text-[#00b85c]' : 'text-white'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}$
                            {item.netAmount.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="flex items-center justify-end space-x-1 mt-0.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${statusColor}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : item.status === 'PENDING' ? (
                                <Clock className="w-2.5 h-2.5" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5" />
                              )}
                              <span>{isCompleted ? 'COMPLETED' : item.status}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-[#8b949e]">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Official Transaction Receipt */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[#23293a] bg-[#10131c] space-y-3 text-xs animate-fadeIn">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                            <div className="text-[10px] text-[#8b949e]">Reference / TX ID</div>
                            <div className="font-mono font-bold text-white flex items-center justify-between mt-0.5">
                              <span className="truncate">{item.refId}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(item.refId);
                                }}
                                className="text-[#3b82f6] hover:underline ml-1 shrink-0 cursor-pointer"
                              >
                                {copiedId === item.refId ? 'Copied' : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                            <div className="text-[10px] text-[#8b949e]">Payment Network</div>
                            <div className="font-bold text-white truncate mt-0.5">{item.network}</div>
                          </div>

                          <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                            <div className="text-[10px] text-[#8b949e]">
                              {isDeposit ? 'Sender / Account' : 'Destination Account'}
                            </div>
                            <div className="font-mono font-bold text-white truncate mt-0.5">
                              {item.details}
                            </div>
                          </div>

                          <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                            <div className="text-[10px] text-[#8b949e]">Base Amount</div>
                            <div className="font-mono font-bold text-white mt-0.5">
                              ${item.amount.toFixed(2)} USD
                            </div>
                          </div>

                          {isDeposit ? (
                            <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                              <div className="text-[10px] text-[#8b949e]">Bonus Credited</div>
                              <div className="font-mono font-bold text-[#00b85c] mt-0.5">
                                +${item.bonusAmount.toFixed(2)} USD
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                              <div className="text-[10px] text-[#8b949e]">Commission Fee</div>
                              <div className="font-mono font-bold text-[#00b85c] mt-0.5">
                                $0.00 (0%)
                              </div>
                            </div>
                          )}

                          <div className="bg-[#161a26] p-2 rounded-lg border border-[#23293a]">
                            <div className="text-[10px] text-[#8b949e]">Ledger Balance After</div>
                            <div className="font-mono font-bold text-white mt-0.5">
                              $
                              {(item.balanceAfter ?? realBalance).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Status Synchronization Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="text-[10px] text-[#8b949e]">
                            Internal Ledger ID: <span className="font-mono text-white">{item.id}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!isDeposit && item.status === 'PENDING' && (
                              <button
                                onClick={() => approveWithdrawal(item.id)}
                                className="px-3 py-1 rounded-lg bg-[#00b85c] hover:bg-[#00d66c] text-slate-950 font-black text-[10px] cursor-pointer"
                              >
                                ✓ Mark Completed
                              </button>
                            )}
                            <button
                              onClick={() =>
                                isDeposit
                                  ? removeDepositFromHistory(item.id)
                                  : removeWithdrawalFromHistory(item.id)
                              }
                              className="p-1.5 rounded-lg bg-[#1e2436] hover:bg-[#ff3d3d]/20 text-[#8b949e] hover:text-[#ff5252] transition-colors cursor-pointer"
                              title="Remove Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            /* CLOSED TRADES HISTORY TAB */
            filteredTrades.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="text-sm font-bold text-white">No Closed Trades Yet</div>
                <p className="text-xs text-[#8b949e]">
                  Completed UP and DOWN trades will appear here with entry and exit prices.
                </p>
              </div>
            ) : (
              filteredTrades.map((trade) => {
                const isWon = trade.status === 'WON';
                const isTie = trade.status === 'TIE';
                const isUp = trade.direction === 'UP';

                return (
                  <div
                    key={trade.id}
                    className="bg-[#181c29] border border-[#23293a] rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isUp
                            ? 'bg-[#00b85c]/15 text-[#00b85c] border border-[#00b85c]/30'
                            : 'bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30'
                        }`}
                      >
                        {isUp ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-white truncate">
                            {trade.assetName}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#23293a] text-[#00b85c]">
                            {trade.payoutRate}%
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8b949e] font-mono mt-0.5">
                          Entry: {trade.entryPrice} → Exit: {trade.exitPrice} •{' '}
                          {new Date(trade.openTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-mono font-black ${
                            isWon
                              ? 'text-[#00b85c]'
                              : isTie
                              ? 'text-[#f59e0b]'
                              : 'text-[#ff5252]'
                          }`}
                        >
                          {isWon
                            ? `+$${(trade.amount + (trade.actualProfit || 0)).toFixed(2)}`
                            : isTie
                            ? `$${trade.amount.toFixed(2)}`
                            : `-$${trade.amount.toFixed(2)}`}
                        </div>
                        <div className="text-[10px] text-[#8b949e] font-mono">
                          Stake: ${trade.amount.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTradeFromHistory(trade.id)}
                        className="p-1.5 rounded-lg bg-[#10131c] hover:bg-[#ff3d3d]/20 text-[#8b949e] hover:text-[#ff5252] transition-colors cursor-pointer"
                        title="Remove Trade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
