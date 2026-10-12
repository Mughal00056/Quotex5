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
    category: 'Mobile Banking (PK)',
    badge: 'INSTANT',
    min: 10,
    max: 50000,
    processingTime: 'Instant (0-2 mins)',
    fee: '0%',
    accountTitle: 'QUOTEX GLOBAL PAY PK',
    accountNumber: '0345-8923410',
    network: 'Easypaisa Direct Merchant',
    icon: '📱',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    category: 'Mobile Banking (PK)',
    badge: 'INSTANT',
    min: 10,
    max: 50000,
    processingTime: 'Instant (0-2 mins)',
    fee: '0%',
    accountTitle: 'QUOTEX FINTECH PK',
    accountNumber: '0301-7645129',
    network: 'JazzCash Auto-Gateway',
    icon: '📲',
  },
  {
    id: 'binance_pay',
    name: 'Binance Pay',
    category: 'Crypto Express',
    badge: 'POPULAR',
    min: 10,
    max: 500000,
    processingTime: 'Instant',
    fee: '0%',
    accountTitle: 'QUOTEX OFFICIAL MERCHANT',
    accountNumber: 'Pay ID: 849201948',
    network: 'Binance Pay Instant',
    icon: '🟡',
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
  },
];

const PRESET_AMOUNTS = [20, 50, 100, 250, 500, 1000, 2500, 5000];

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
  const [amount, setAmount] = useState<number>(100);
  const [useBonus, setUseBonus] = useState<boolean>(true);
  const [promoCode] = useState<string>('VIP30');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [step, setStep] = useState<'SELECT' | 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastCreatedTxId, setLastCreatedTxId] = useState<string>('');

  if (!isOpen) return null;

  const bonusPercent = useBonus ? (amount >= 500 ? 50 : amount >= 100 ? 30 : 20) : 0;
  const bonusAmount = Number(((amount * bonusPercent) / 100).toFixed(2));
  const totalCredited = Number((amount + bonusAmount).toFixed(2));
  const balanceAfter = Number((realBalance + totalCredited).toFixed(2));

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
    }, 650);
  };

  const resetModal = () => {
    setStep('SELECT');
    setSenderAccount('');
  };

  const recentDeposits = deposits.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141722] border border-[#23293a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#23293a] bg-[#181c29] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00b85c]/15 border border-[#00b85c]/40 flex items-center justify-center text-[#00b85c]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                  LIVE CASHIER • DEPOSIT FUNDS
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#00b85c]/20 text-[#00b85c] border border-[#00b85c]/30">
                  0% FEE
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Live Balance:{' '}
                <span className="text-[#00b85c] font-mono font-bold">
                  ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {onOpenWithdraw && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWithdraw();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#1e2436] hover:bg-[#262d42] border border-[#2b3247] text-[11px] font-bold text-[#c9d1d9] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#ff5252]" />
                <span className="hidden sm:inline">Withdraw</span>
              </button>
            )}
            {onOpenHistory && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#1e2436] hover:bg-[#262d42] border border-[#2b3247] text-[11px] font-bold text-[#c9d1d9] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="hidden sm:inline">History</span>
              </button>
            )}
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="p-1.5 text-[#8b949e] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 custom-scrollbar">
          {step === 'SELECT' && (
            <form onSubmit={handleProceedToCheckout} className="space-y-4">
              {/* 1. Payment Methods Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#8b949e]">
                    1. Choose Payment Method
                  </label>
                  <span className="text-[10px] text-[#00b85c] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> SSL 256-Bit Encrypted
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const isSelected = selectedMethod.id === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMethod(m)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? 'bg-[#1c2336] border-[#00b85c] shadow-[0_0_15px_rgba(0,184,92,0.18)]'
                            : 'bg-[#181c29] border-[#23293a] hover:border-[#343d56]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg leading-none">{m.icon}</span>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                              isSelected
                                ? 'bg-[#00b85c] text-slate-950'
                                : 'bg-[#23293a] text-[#8b949e]'
                            }`}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white truncate">{m.name}</div>
                        <div className="text-[10px] text-[#8b949e] truncate">{m.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Deposit Amount & Presets */}
              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#8b949e]">
                    2. Enter Deposit Amount (USD)
                  </label>
                  <span className="text-[10px] text-[#8b949e] font-mono">
                    Min: ${selectedMethod.min} • Max: ${selectedMethod.max.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-[#00b85c]">
                    $
                  </span>
                  <input
                    type="number"
                    min={selectedMethod.min}
                    max={selectedMethod.max}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#10131c] border border-[#2a3042] focus:border-[#00b85c] rounded-xl pl-8 pr-20 py-2.5 text-lg font-mono font-black text-white focus:outline-none transition-colors"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b949e]">
                    USD
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                        amount === val
                          ? 'bg-[#00b85c] border-[#00b85c] text-slate-950 shadow-sm'
                          : 'bg-[#12151f] border-[#23293a] text-[#c9d1d9] hover:border-[#343d56]'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Bonus Toggle */}
              <div
                onClick={() => setUseBonus(!useBonus)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  useBonus
                    ? 'bg-[#00b85c]/10 border-[#00b85c]/50'
                    : 'bg-[#181c29] border-[#23293a]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      useBonus ? 'bg-[#00b85c] text-slate-950' : 'bg-[#23293a] text-[#8b949e]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>+{bonusPercent}% Deposit Bonus</span>
                      {useBonus && (
                        <span className="text-[10px] font-mono text-[#00b85c]">
                          (+${bonusAmount.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8b949e]">Promo Code: {promoCode} • Instant Credit</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    useBonus
                      ? 'bg-[#00b85c] border-[#00b85c] text-slate-950'
                      : 'border-[#384152]'
                  }`}
                >
                  {useBonus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* 4. Summary Bar */}
              <div className="bg-[#10131c] border border-[#23293a] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e] font-bold">
                    Total To Be Credited
                  </div>
                  <div className="text-xl font-mono font-black text-[#00b85c]">
                    ${totalCredited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8b949e] font-mono">
                    New Balance After Deposit: ${balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00b85c] to-[#00d66c] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center space-x-2 shadow-lg shadow-[#00b85c]/25 transition-all cursor-pointer"
                >
                  <span>CONTINUE TO PAYMENT</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          )}

          {step === 'CHECKOUT' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#23293a] pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{selectedMethod.icon}</span>
                    <div>
                      <div className="text-sm font-black text-white">{selectedMethod.name}</div>
                      <div className="text-[11px] text-[#8b949e]">{selectedMethod.network}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#8b949e] uppercase font-bold">Amount Due</div>
                    <div className="text-base font-mono font-black text-[#00b85c]">
                      ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                  </div>
                </div>

                {/* Official Merchant Account Details */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#8b949e]">
                    Official Receiving Account / Wallet Details
                  </div>

                  <div className="bg-[#10131c] border border-[#23293a] rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#8b949e]">Account Title / Network</div>
                      <div className="text-xs font-bold text-white">{selectedMethod.accountTitle}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00b85c]/15 text-[#00b85c] font-bold">
                      Verified Merchant
                    </span>
                  </div>

                  <div className="bg-[#10131c] border border-[#23293a] rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-[#8b949e]">Account Number / Wallet Address</div>
                      <div className="text-xs font-mono font-black text-[#00b85c] truncate">
                        {selectedMethod.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountNumber, 'address')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e2436] hover:bg-[#283048] text-xs font-bold text-white flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText === 'address' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Sender Info */}
                <div className="pt-1">
                  <label className="block text-[10px] font-bold uppercase text-[#8b949e] mb-1">
                    Your Sender Account / Phone / Wallet Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="e.g. 0300-1234567 or Wallet Ref"
                    className="w-full bg-[#10131c] border border-[#2a3042] focus:border-[#00b85c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="px-4 py-2.5 rounded-xl bg-[#1e2436] hover:bg-[#283048] text-xs font-bold text-[#c9d1d9] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00b85c] to-[#00d66c] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-[#00b85c]/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    CONFIRM & CREDIT ${totalCredited.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-[#00b85c]/30 border-t-[#00b85c] animate-spin" />
              <div className="text-base font-black text-white">Verifying Deposit Transaction...</div>
              <p className="text-xs text-[#8b949e] max-w-xs">
                Synchronizing payment record with {selectedMethod.name} gateway and updating your Live account ledger.
              </p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#00b85c]/10 border border-[#00b85c]/40 rounded-2xl p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#00b85c] text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-[#00b85c]/30">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="text-base font-black text-white">
                  DEPOSIT COMPLETED & CREDITED!
                </div>
                <div className="text-2xl font-mono font-black text-[#00b85c]">
                  +${totalCredited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-[#8b949e]">
                  Method: <span className="text-white font-semibold">{selectedMethod.name}</span> • Ref:{' '}
                  <span className="text-white font-mono">{lastCreatedTxId}</span>
                </p>
              </div>

              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Deposit Amount</span>
                  <span className="font-mono font-bold text-white">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Bonus Credited ({bonusPercent}%)</span>
                  <span className="font-mono font-bold text-[#00b85c]">+${bonusAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Updated Live Balance</span>
                  <span className="font-mono font-black text-white">
                    ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2436] hover:bg-[#283048] text-xs font-bold text-white cursor-pointer"
                >
                  Make Another Deposit
                </button>
                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      resetModal();
                      onClose();
                      onOpenHistory();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-xs font-bold text-white cursor-pointer"
                  >
                    View In Transaction History
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#00b85c] hover:bg-[#00d66c] text-xs font-black text-slate-950 cursor-pointer"
                >
                  Start Trading Now
                </button>
              </div>
            </div>
          )}

          {/* Live Synchronized Recent Deposits Preview */}
          {recentDeposits.length > 0 && (
            <div className="pt-2 border-t border-[#23293a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8b949e]">
                  Recent Synchronized Deposits ({deposits.length})
                </span>
                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHistory();
                    }}
                    className="text-[10px] font-bold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    View Full History →
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {recentDeposits.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#10131c] border border-[#23293a] rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0 bg-[#00b85c]" />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {tx.method} • <span className="font-mono text-[10px] text-[#8b949e]">{tx.txHash}</span>
                        </div>
                        <div className="text-[10px] text-[#8b949e]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-[#00b85c]">
                        +${tx.totalCredited.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-black uppercase text-[#00b85c]">
                        {tx.status}
                      </div>
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
