import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  History,
  Wallet,
  Copy,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  Percent,
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onOpenDeposit?: () => void;
}

const WITHDRAW_METHODS = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    category: 'Mobile Wallet (PK)',
    min: 10,
    max: 50000,
    fee: 0,
    speed: 'Instant (1-5 mins)',
    placeholder: '03XX-XXXXXXX (11-digit Easypaisa Number)',
    network: 'Easypaisa Direct Payout',
    icon: '📱',
    accentColor: '#00e599',
    type: 'fiat',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    category: 'Mobile Wallet (PK)',
    min: 10,
    max: 50000,
    fee: 0,
    speed: 'Instant (1-5 mins)',
    placeholder: '03XX-XXXXXXX (11-digit JazzCash Number)',
    network: 'JazzCash Auto Payout',
    icon: '📲',
    accentColor: '#ff9800',
    type: 'fiat',
  },
  {
    id: 'binance_pay',
    name: 'Binance Pay',
    category: 'Crypto Instant',
    min: 10,
    max: 500000,
    fee: 0,
    speed: 'Instant (Zero Network Fee)',
    placeholder: 'Binance Pay ID / UID / Email',
    network: 'Binance Pay Internal Transfer',
    icon: '🟡',
    accentColor: '#f59e0b',
    type: 'crypto',
  },
  {
    id: 'usdt_trc20',
    name: 'USDT (TRC-20)',
    category: 'TRON Network',
    min: 10,
    max: 1000000,
    fee: 0,
    speed: '2 - 5 mins',
    placeholder: 'T... (TRON TRC-20 Wallet Address)',
    network: 'TRON (TRC-20)',
    icon: '₮',
    accentColor: '#06b6d4',
    type: 'crypto',
  },
  {
    id: 'usdt_bep20',
    name: 'USDT (BEP-20)',
    category: 'BNB Smart Chain',
    min: 10,
    max: 1000000,
    fee: 0,
    speed: '2 - 5 mins',
    placeholder: '0x... (BEP-20 Wallet Address)',
    network: 'BNB Smart Chain (BEP-20)',
    icon: '🪙',
    accentColor: '#10b981',
    type: 'crypto',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer / IBAN',
    category: 'Local Bank / Raast',
    min: 20,
    max: 250000,
    fee: 0,
    speed: 'Instant via Raast',
    placeholder: 'PKXX XXXX ... (IBAN or Account Number)',
    network: 'Raast / IBFT Bank Payout',
    icon: '🏦',
    accentColor: '#3b82f6',
    type: 'fiat',
  },
  {
    id: 'visa_master',
    name: 'Visa / MasterCard',
    category: 'Card Payout',
    min: 20,
    max: 100000,
    fee: 0,
    speed: '5 - 30 mins',
    placeholder: '4XXX XXXX XXXX XXXX (16-digit Card Number)',
    network: 'Visa Direct / MasterCard Send',
    icon: '💳',
    accentColor: '#8b5cf6',
    type: 'fiat',
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    category: 'Bitcoin Network',
    min: 25,
    max: 1000000,
    fee: 0,
    speed: '10 - 30 mins',
    placeholder: 'bc1q... or 1... or 3... (BTC Address)',
    network: 'Bitcoin Mainnet',
    icon: '₿',
    accentColor: '#f97316',
    type: 'crypto',
  },
];

const QUICK_WITHDRAW_AMOUNTS = [25, 50, 100, 250, 500, 1000, 2500, 5000];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
  onOpenDeposit,
}) => {
  const {
    realBalance = 0,
    withdrawFunds,
    withdrawals = [],
    approveWithdrawal,
  } = useTrading();

  const [selectedMethod, setSelectedMethod] = useState(WITHDRAW_METHODS[0]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [amount, setAmount] = useState<number>(100);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [step, setStep] = useState<'FORM' | 'PROCESSING' | 'SUCCESS'>('FORM');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdWithdrawalId, setCreatedWithdrawalId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  if (!isOpen) return null;

  const balanceAfter = Math.max(0, Number((realBalance - amount).toFixed(2)));
  const recentWithdrawals = withdrawals.slice(0, 4);

  const filteredMethods = WITHDRAW_METHODS.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.type === filterCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount < selectedMethod.min) {
      setErrorMsg(`Minimum withdrawal for ${selectedMethod.name} is $${selectedMethod.min}.`);
      return;
    }
    if (amount > realBalance) {
      setErrorMsg('Insufficient Live Balance for this withdrawal amount. Deposit or enter a smaller amount.');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMsg(`Please enter your ${selectedMethod.name} destination account or address.`);
      return;
    }

    setStep('PROCESSING');
    setTimeout(() => {
      const res = withdrawFunds(
        amount,
        selectedMethod.name,
        destinationAddress.trim(),
        accountHolderName.trim() || 'Verified Account Holder'
      );
      if (!res.success || !res.transaction) {
        setErrorMsg(res.message || 'Unable to process withdrawal.');
        setStep('FORM');
        return;
      }
      setCreatedWithdrawalId(res.transaction.txId || res.transaction.id);
      setStep('SUCCESS');
    }, 600);
  };

  const resetModal = () => {
    setStep('FORM');
    setErrorMsg('');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Quick Percentage Calculation
  const setPercentageAmount = (pct: number) => {
    if (realBalance <= 0) return;
    const calc = Math.floor((realBalance * pct) / 100);
    setAmount(Math.max(selectedMethod.min, calc));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
      {/* Ambient Crimson / Coral Glass Glowing Aura */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-rose-500/20 to-amber-500/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Main Glass Dialog */}
      <div className="relative bg-gradient-to-b from-[#141224]/95 via-[#0e101f]/98 to-[#090b14]/98 border border-white/15 w-full max-w-2xl rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden text-white max-h-[92vh] flex flex-col backdrop-blur-2xl">
        {/* Top Powerful Header */}
        <div className="relative px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-pink-500/20 to-purple-500/30 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full border-2 border-[#0e101f] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
                  <span>QUOTEX INSTANT WITHDRAWAL</span>
                  <span className="text-[9px] bg-gradient-to-r from-rose-400 to-pink-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md shadow-xs">
                    0% FEE
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span>Withdrawable Balance:</span>
                <span className="text-[#00e599] font-mono font-black text-xs drop-shadow-[0_0_6px_rgba(0,229,153,0.5)]">
                  ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400">• Instant IBFT/Raast</span>
              </div>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center space-x-1.5">
            {onOpenDeposit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-[11px] font-bold text-slate-200 hover:text-emerald-300 flex items-center space-x-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5 text-[#00e599] stroke-[2.2]" />
                <span className="hidden sm:inline">Deposit</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[11px] font-bold text-slate-200 hover:text-cyan-300 flex items-center space-x-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <History className="w-3.5 h-3.5 text-cyan-400 stroke-[2.2]" />
                <span className="hidden sm:inline">History</span>
              </button>
            )}

            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/50 flex items-center gap-3 text-xs text-rose-300 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'FORM' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Filter Pills (All / Fiat Mobile Wallets / Crypto) */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Payout Methods
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('fiat')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'fiat'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📱 Easypaisa / JazzCash / Banks
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('crypto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'crypto'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Crypto & USDT
                  </button>
                </div>

                <div className="text-[10px] text-rose-300 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/25">
                  <Zap className="w-3 h-3 text-rose-400 fill-rose-400" />
                  <span>Instant Gateway Connected</span>
                </div>
              </div>

              {/* 1. Payment Methods Grid with Powerful Glass Cards */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-2">
                  1. Choose Payout Destination Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {filteredMethods.map((m) => {
                    const isSelected = selectedMethod.id === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMethod(m)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden cursor-pointer group active:scale-[0.98] ${
                          isSelected
                            ? 'bg-gradient-to-b from-rose-500/20 via-[#1f1128]/90 to-[#120a1c]/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-7 h-7 bg-rose-500 text-white flex items-center justify-center rounded-bl-xl shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl drop-shadow-md leading-none group-hover:scale-110 transition-transform">
                            {m.icon}
                          </span>
                          {!isSelected && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-white/[0.06] text-slate-400 border border-white/5">
                              {m.speed.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-black text-white truncate group-hover:text-rose-300 transition-colors">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.category}</div>

                        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                          <span>Min: ${m.min}</span>
                          <span className="text-emerald-400 font-bold">{m.speed}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Withdrawal Amount & Fast Percentage Presets */}
              <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>2. Enter Withdrawal Amount (USD)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/10">
                    Min: ${selectedMethod.min} • Max: ${selectedMethod.max.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                    $
                  </span>
                  <input
                    type="number"
                    min={selectedMethod.min}
                    max={Math.min(selectedMethod.max, realBalance > 0 ? realBalance : selectedMethod.max)}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#0a0f1d]/90 border border-white/20 focus:border-rose-400 rounded-2xl pl-10 pr-24 py-3 text-2xl font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 transition-all shadow-inner"
                    placeholder="100"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-black text-slate-300 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/10">
                    <span>USD</span>
                  </div>
                </div>

                {/* Percentage Quick-Pills (25%, 50%, 75%, 100% MAX) */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      type="button"
                      key={pct}
                      onClick={() => setPercentageAmount(pct)}
                      className="py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-xs font-black text-slate-200 hover:text-rose-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>{pct === 100 ? 'MAX (100%)' : `${pct}%`}</span>
                    </button>
                  ))}
                </div>

                {/* Fast Preset Dollar Buttons */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {QUICK_WITHDRAW_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                        amount === val
                          ? 'bg-rose-500 border-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Account / Address Details */}
              <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-200">
                  3. Recipient Account / Wallet Details
                </label>

                <div>
                  <div className="text-[10px] text-slate-400 mb-1 font-bold">
                    {selectedMethod.name} Destination Address / Account Number *
                  </div>
                  <input
                    type="text"
                    required
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder={selectedMethod.placeholder}
                    className="w-full bg-[#090e1a] border border-white/15 focus:border-rose-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                  />
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 mb-1 font-bold">
                    Account Holder Name (Optional)
                  </div>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full bg-[#090e1a] border border-white/15 focus:border-rose-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Real-Time Balance Ledger Preview */}
              <div className="bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-transparent border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-black tracking-wider">
                    Balance After Payout
                  </div>
                  <div className="text-2xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(244,63,94,0.4)] mt-0.5">
                    ${balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Deducting: ${amount.toFixed(2)} USD • Fee: $0.00 (0% FREE)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={amount < selectedMethod.min || (realBalance > 0 && amount > realBalance)}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 hover:brightness-110 active:scale-95 text-white font-black text-sm tracking-wide flex items-center space-x-2 shadow-[0_0_25px_rgba(244,63,94,0.5)] cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>Submit Withdrawal</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {step === 'PROCESSING' && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-rose-400 animate-pulse stroke-[2.5]" />
                </div>
              </div>
              <div className="text-lg font-black text-white">Broadcasting Payout Request...</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Authenticating ledger and routing ${amount.toFixed(2)} to your {selectedMethod.name} account via secure automated settlement.
              </p>
            </div>
          )}

          {/* STEP 3: SUCCESS WITH REFERENCE ID */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-b from-rose-500/25 via-pink-950/40 to-rose-500/10 border border-rose-500/50 rounded-3xl p-6 text-center space-y-3 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(244,63,94,0.7)]">
                  <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="text-lg font-black text-white tracking-wide">
                  WITHDRAWAL SUCCESSFULLY SUBMITTED!
                </div>
                <div className="text-3xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                  <span>TxRef:</span>
                  <span className="font-mono text-cyan-300 font-bold">{createdWithdrawalId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(createdWithdrawalId)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-95 transition-all"
                    title="Copy Transaction ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payout Method</span>
                  <span className="font-bold text-white">{selectedMethod.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Account / Address</span>
                  <span className="font-mono font-bold text-cyan-300 truncate max-w-[220px]">
                    {destinationAddress}
                  </span>
                </div>
                {accountHolderName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Holder</span>
                    <span className="font-bold text-white">{accountHolderName}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-300 font-bold">Remaining Live Balance</span>
                  <span className="font-mono font-black text-[#00e599] text-sm">
                    ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Instant Simulator Approval Button for instant demo testing */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-300 font-bold">
                  ⚡ Simulator Demo Mode: Approve payout immediately
                </div>
                <button
                  type="button"
                  onClick={() => {
                    approveWithdrawal(createdWithdrawalId);
                    alert('Withdrawal marked as COMPLETED & APPROVED!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00e599] text-slate-950 font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all shrink-0"
                >
                  Approve Now
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white cursor-pointer active:scale-95 transition-all border border-white/10"
                >
                  Make Another Withdrawal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all"
                >
                  Return to Chart
                </button>
              </div>
            </div>
          )}

          {/* Recent Withdrawals Ledger */}
          {recentWithdrawals.length > 0 && step === 'FORM' && (
            <div className="pt-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Recent Withdrawals</span>
                <span className="text-rose-400 font-bold">{withdrawals.length} Total</span>
              </div>
              <div className="space-y-1.5">
                {recentWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="font-bold text-white">{w.method}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white">
                        -${w.amount.toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          w.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
