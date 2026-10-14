import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Sparkles,
  Wallet,
  ArrowRight,
  Check,
  History,
  ArrowUpRight,
  Zap,
  Lock,
  Layers,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onOpenWithdraw?: () => void;
}

const PAYMENT_METHODS = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    category: 'Mobile Wallet (PK)',
    badge: 'INSTANT',
    min: 10,
    max: 50000,
    processingTime: 'Instant (0-2 mins)',
    fee: '0%',
    accountTitle: 'QUOTEX GLOBAL PAY PK',
    accountNumber: '0345-8923410',
    network: 'Easypaisa Direct Merchant',
    icon: '📱',
    accentColor: '#00e599',
    type: 'fiat',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    category: 'Mobile Wallet (PK)',
    badge: 'INSTANT',
    min: 10,
    max: 50000,
    processingTime: 'Instant (0-2 mins)',
    fee: '0%',
    accountTitle: 'QUOTEX FINTECH PK',
    accountNumber: '0301-7645129',
    network: 'JazzCash Auto-Gateway',
    icon: '📲',
    accentColor: '#ff9800',
    type: 'fiat',
  },
  {
    id: 'binance_pay',
    name: 'Binance Pay',
    category: 'Crypto Express',
    badge: 'POPULAR',
    min: 10,
    max: 500000,
    processingTime: 'Instant (Zero Confirmation)',
    fee: '0%',
    accountTitle: 'QUOTEX OFFICIAL MERCHANT',
    accountNumber: 'Pay ID: 849201948',
    network: 'Binance Pay Instant',
    icon: '🟡',
    accentColor: '#f59e0b',
    type: 'crypto',
  },
  {
    id: 'usdt_trc20',
    name: 'Tether USDT (TRC-20)',
    category: 'Cryptocurrency',
    badge: 'FAST',
    min: 10,
    max: 1000000,
    processingTime: '1 - 3 mins',
    fee: '0%',
    accountTitle: 'TRON (TRC-20) Deposit Address',
    accountNumber: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    network: 'TRON (TRC-20)',
    icon: '₮',
    accentColor: '#06b6d4',
    type: 'crypto',
  },
  {
    id: 'usdt_bep20',
    name: 'Tether USDT (BEP-20)',
    category: 'Cryptocurrency',
    badge: '0% FEE',
    min: 10,
    max: 1000000,
    processingTime: '1 - 3 mins',
    fee: '0%',
    accountTitle: 'BSC (BEP-20) Deposit Address',
    accountNumber: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    network: 'BNB Smart Chain (BEP-20)',
    icon: '🪙',
    accentColor: '#10b981',
    type: 'crypto',
  },
  {
    id: 'bank_transfer',
    name: 'Local Bank Transfer',
    category: 'Bank Wire / Raast',
    badge: 'RAAST',
    min: 20,
    max: 250000,
    processingTime: 'Instant via Raast / IBFT',
    fee: '0%',
    accountTitle: 'MEEZAN BANK - QUOTEX SETTLEMENT',
    accountNumber: 'PK36MEZN0002840105829104',
    network: 'IBFT / Raast Instant',
    icon: '🏦',
    accentColor: '#3b82f6',
    type: 'fiat',
  },
  {
    id: 'visa_master',
    name: 'Visa / MasterCard',
    category: 'Bank Card',
    badge: 'GLOBAL',
    min: 10,
    max: 100000,
    processingTime: 'Instant',
    fee: '0%',
    accountTitle: '3D-Secure Card Gateway',
    accountNumber: 'XXXX-XXXX-XXXX-4210',
    network: 'Visa / MasterCard 3DS',
    icon: '💳',
    accentColor: '#8b5cf6',
    type: 'fiat',
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    category: 'Cryptocurrency',
    badge: 'CRYPTO',
    min: 20,
    max: 1000000,
    processingTime: '5 - 15 mins',
    fee: '0%',
    accountTitle: 'BTC SegWit Address',
    accountNumber: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin Native SegWit',
    icon: '₿',
    accentColor: '#f97316',
    type: 'crypto',
  },
];

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000, 2500, 5000];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
  onOpenWithdraw,
}) => {
  const {
    depositFunds,
    realBalance = 0,
    accountType,
    setAccountType,
    deposits = [],
  } = useTrading();

  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [amount, setAmount] = useState<number>(100);
  const [useBonus, setUseBonus] = useState<boolean>(true);
  const [promoCode] = useState<string>('VIP50');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [step, setStep] = useState<'SELECT' | 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastCreatedTxId, setLastCreatedTxId] = useState<string>('');

  if (!isOpen) return null;

  const bonusPercent = useBonus ? (amount >= 500 ? 50 : amount >= 100 ? 35 : 25) : 0;
  const bonusAmount = Number(((amount * bonusPercent) / 100).toFixed(2));
  const totalCredited = Number((amount + bonusAmount).toFixed(2));
  const balanceAfter = Number((realBalance + totalCredited).toFixed(2));

  const filteredMethods = PAYMENT_METHODS.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.type === filterCategory;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleProceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < selectedMethod.min) return;
    setStep('CHECKOUT');
  };

  const handleConfirmPayment = () => {
    setStep('PROCESSING');
    setTimeout(() => {
      const tx = depositFunds(
        amount,
        selectedMethod.name,
        useBonus ? promoCode : undefined,
        senderAccount.trim() || 'Verified Live Account'
      );
      setLastCreatedTxId(tx.txHash || tx.id);
      if (accountType !== 'REAL') {
        setAccountType('REAL');
      }
      setStep('SUCCESS');
    }, 600);
  };

  const resetModal = () => {
    setStep('SELECT');
    setSenderAccount('');
  };

  const recentDeposits = deposits.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
      {/* Powerful Ambient Glowing Background Aura */}
      <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-[#00e599]/20 to-[#00f0ff]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Glass Dialog Window */}
      <div className="relative bg-gradient-to-b from-[#0f172a]/95 via-[#0b1222]/98 to-[#070b16]/98 border border-white/15 w-full max-w-2xl rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden text-white max-h-[92vh] flex flex-col backdrop-blur-2xl">
        {/* Top Powerful Glass Header */}
        <div className="relative px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00e599]/30 via-emerald-500/20 to-cyan-500/30 border border-[#00e599]/50 flex items-center justify-center text-[#00e599] shadow-[0_0_20px_rgba(0,229,153,0.3)]">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00e599] rounded-full border-2 border-[#0b1222] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white drop-shadow-sm flex items-center gap-1.5">
                  <span>QUOTEX INSTANT DEPOSIT</span>
                  <span className="text-[9px] bg-gradient-to-r from-emerald-400 to-[#00e599] text-slate-950 font-black px-1.5 py-0.2 rounded-md shadow-xs">
                    0% FEE
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span>Live Balance:</span>
                <span className="text-[#00e599] font-mono font-black text-xs drop-shadow-[0_0_6px_rgba(0,229,153,0.5)]">
                  ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400">• SSL 256-Bit</span>
              </div>
            </div>
          </div>

          {/* Action pills (Withdraw, History, Close) */}
          <div className="flex items-center space-x-1.5">
            {onOpenWithdraw && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWithdraw();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-[11px] font-bold text-slate-200 hover:text-rose-300 flex items-center space-x-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Withdraw</span>
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
          {step === 'SELECT' && (
            <form onSubmit={handleProceedToCheckout} className="space-y-4">
              {/* Category Filter Pills (All / Fiat Mobile Banking / Crypto) */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-gradient-to-r from-[#00e599] to-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(0,229,153,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Methods
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('fiat')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'fiat'
                        ? 'bg-gradient-to-r from-[#00e599] to-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(0,229,153,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📱 Mobile & Banks (PK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('crypto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === 'crypto'
                        ? 'bg-gradient-to-r from-[#00e599] to-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(0,229,153,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Crypto & Binance Pay
                  </button>
                </div>

                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/25">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Instant Credit Engine Active</span>
                </div>
              </div>

              {/* 1. Payment Methods Grid with Powerful Glass Cards */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-2">
                  1. Select Payment Method
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
                            ? 'bg-gradient-to-b from-[#00e599]/20 via-[#0b1b2a]/90 to-[#071322]/95 border-[#00e599] shadow-[0_0_25px_rgba(0,229,153,0.3)] ring-1 ring-[#00e599]'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-7 h-7 bg-[#00e599] text-slate-950 flex items-center justify-center rounded-bl-xl shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl drop-shadow-md leading-none group-hover:scale-110 transition-transform">
                            {m.icon}
                          </span>
                          {!isSelected && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-white/[0.06] text-slate-400 border border-white/5">
                              {m.badge}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.category}</div>

                        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
                          <span>Min: ${m.min}</span>
                          <span className="text-emerald-400 font-bold">{m.fee} Fee</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Deposit Amount & Presets */}
              <div className="bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Enter Deposit Amount (USD)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/10">
                    Min: ${selectedMethod.min} • Max: ${selectedMethod.max.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#00e599] drop-shadow-[0_0_8px_rgba(0,229,153,0.5)]">
                    $
                  </span>
                  <input
                    type="number"
                    min={selectedMethod.min}
                    max={selectedMethod.max}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#0a0f1d]/90 border border-white/20 focus:border-[#00e599] rounded-2xl pl-10 pr-24 py-3 text-2xl font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-[#00e599]/30 transition-all shadow-inner"
                    placeholder="100"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-black text-slate-300 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/10">
                    <span>USD</span>
                  </div>
                </div>

                {/* Preset Fast Amount Pills */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                        amount === val
                          ? 'bg-[#00e599] border-[#00e599] text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,153,0.4)] scale-105'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. High-Powered Shimmer Bonus Card (50% Extra Capital) */}
              <div
                onClick={() => setUseBonus(!useBonus)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                  useBonus
                    ? 'bg-gradient-to-r from-emerald-950/60 via-[#0a2024]/80 to-cyan-950/60 border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        useBonus
                          ? 'bg-gradient-to-tr from-emerald-400 to-[#00e599] text-slate-950 shadow-[0_0_15px_rgba(0,229,153,0.6)]'
                          : 'bg-white/[0.08] text-slate-400'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>VIP PROMO BONUS: +{bonusPercent}% TRADING BOOST</span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-xs">
                          {promoCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Receive extra free trading capital directly into your Live account.
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-mono font-black ${
                        useBonus ? 'text-[#00e599]' : 'text-slate-400'
                      }`}
                    >
                      +${bonusAmount.toFixed(2)} FREE
                    </div>
                    <div className="text-[9px] font-bold uppercase text-slate-400">
                      {useBonus ? 'BONUS ACTIVE' : 'TAP TO APPLY'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Total Calculation Summary Card */}
              <div className="bg-gradient-to-r from-[#00e599]/15 via-cyan-500/10 to-transparent border border-[#00e599]/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-black tracking-wider">
                    Total Funds Added To Live Account
                  </div>
                  <div className="text-2xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(0,229,153,0.4)] mt-0.5">
                    ${totalCredited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Deposit: ${amount.toFixed(2)} {useBonus && `+ Bonus: $${bonusAmount.toFixed(2)}`}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={amount < selectedMethod.min}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#00e599] via-emerald-400 to-[#00f7a5] hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm tracking-wide flex items-center space-x-2 shadow-[0_0_25px_rgba(0,229,153,0.5)] cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CHECKOUT & OFFICIAL RECEIVING GATEWAY */}
          {step === 'CHECKOUT' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-4">
                {/* Method & Amount Summary banner */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedMethod.icon}</span>
                    <div>
                      <div className="text-xs font-black text-white">{selectedMethod.name} Gateway</div>
                      <div className="text-[11px] text-slate-400">{selectedMethod.processingTime}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-mono font-black text-[#00e599]">
                      ${amount.toFixed(2)} USD
                    </div>
                    {useBonus && (
                      <div className="text-[10px] text-amber-300 font-bold">
                        +{bonusPercent}% Bonus (${bonusAmount.toFixed(2)})
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Receiving Account Details */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Official Receiving Account / Wallet</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Quotex Settlement
                    </span>
                  </div>

                  <div className="bg-[#090e1a] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Account Title / Network</div>
                      <div className="text-xs font-black text-white">{selectedMethod.accountTitle}</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#00e599]/20 text-[#00e599] font-black border border-[#00e599]/30">
                      {selectedMethod.network}
                    </span>
                  </div>

                  <div className="bg-[#090e1a] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400">Account Number / Wallet Address</div>
                      <div className="text-sm font-mono font-black text-cyan-300 truncate select-all">
                        {selectedMethod.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountNumber, 'address')}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-xs font-bold text-cyan-300 flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95 transition-all shadow-md"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText === 'address' ? 'Copied!' : 'Copy Address'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Sender Reference Input */}
                <div className="pt-1">
                  <label className="block text-[10px] font-black uppercase text-slate-300 mb-1">
                    Your Sender Phone / Account / Wallet TID (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="e.g. 0345-XXXXXXX or TxHash"
                    className="w-full bg-[#090e1a] border border-white/15 focus:border-[#00e599] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 cursor-pointer active:scale-95 transition-all border border-white/10"
                >
                  ← Change Method
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#00e599] via-emerald-400 to-[#00f7a5] hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 shadow-[0_0_30px_rgba(0,229,153,0.5)] cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.8]" />
                  <span>CONFIRM PAYMENT & CREDIT ${totalCredited.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING WITH HIGH-TECH LOADER */}
          {step === 'PROCESSING' && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-[#00e599]/20 border-t-[#00e599] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#00e599] animate-pulse" />
                </div>
              </div>
              <div className="text-lg font-black text-white">Verifying Payment & Syncing Ledger...</div>
              <p className="text-xs text-slate-400 max-w-sm">
                Securely confirming deposit with {selectedMethod.name} network and crediting ${totalCredited.toFixed(2)} to your Live Balance.
              </p>
            </div>
          )}

          {/* STEP 4: SUCCESS WITH GLOWING BADGE */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-b from-[#00e599]/25 via-emerald-950/40 to-[#00e599]/10 border border-[#00e599]/50 rounded-3xl p-6 text-center space-y-3 shadow-[0_0_40px_rgba(0,229,153,0.3)]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00e599] to-emerald-300 text-slate-950 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,229,153,0.7)]">
                  <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="text-lg font-black text-white tracking-wide">
                  DEPOSIT CONFIRMED & INSTANTLY CREDITED!
                </div>
                <div className="text-3xl font-mono font-black text-[#00e599] drop-shadow-[0_0_12px_rgba(0,229,153,0.6)]">
                  +${totalCredited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-300">
                  Method: <span className="text-white font-bold">{selectedMethod.name}</span> • TxID:{' '}
                  <span className="text-cyan-300 font-mono font-bold">{lastCreatedTxId}</span>
                </p>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Principal Deposit</span>
                  <span className="font-mono font-bold text-white">${amount.toFixed(2)}</span>
                </div>
                {useBonus && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">VIP Bonus Boost (+{bonusPercent}%)</span>
                    <span className="font-mono font-bold text-[#00e599]">+${bonusAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-300 font-bold">New Live Trading Balance</span>
                  <span className="font-mono font-black text-[#00e599] text-sm">
                    ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white cursor-pointer active:scale-95 transition-all border border-white/10"
                >
                  Deposit More Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#00e599] to-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-[0_0_20px_rgba(0,229,153,0.4)] active:scale-95 transition-all"
                >
                  Start Live Trading Now 🚀
                </button>
              </div>
            </div>
          )}

          {/* Recent Deposits Quick Ledger (Always accessible) */}
          {recentDeposits.length > 0 && step === 'SELECT' && (
            <div className="pt-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                <span>Recent Deposits</span>
                <span className="text-[#00e599] font-bold">All Verified</span>
              </div>
              <div className="space-y-1.5">
                {recentDeposits.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00e599]" />
                      <span className="font-bold text-white">{d.method}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#00e599]">
                        +${d.amount.toFixed(2)}
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-black">
                        COMPLETED
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
