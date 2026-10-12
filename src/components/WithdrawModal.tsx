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
  Clock,
  Check,
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
  },
  {
    id: 'binance_pay',
    name: 'Binance Pay',
    category: 'Crypto Instant',
    min: 10,
    max: 500000,
    fee: 0,
    speed: 'Instant',
    placeholder: 'Binance Pay ID / UID / Email',
    network: 'Binance Pay Internal Transfer',
    icon: '🟡',
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
    liveBalance,
    createWithdrawal,
    withdrawalTransactions,
    updateWithdrawalStatus,
  } = useTrading();

  const [selectedMethod, setSelectedMethod] = useState(WITHDRAW_METHODS[0]);
  const [amount, setAmount] = useState<number>(100);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [payoutSpeedMode, setPayoutSpeedMode] = useState<'COMPLETED' | 'PENDING'>('COMPLETED');
  const [step, setStep] = useState<'FORM' | 'PROCESSING' | 'SUCCESS'>('FORM');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdWithdrawalId, setCreatedWithdrawalId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  if (!isOpen) return null;

  const balanceAfter = Math.max(0, Number((liveBalance - amount).toFixed(2)));
  const recentWithdrawals = withdrawalTransactions.slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount < selectedMethod.min) {
      setErrorMsg(`Minimum withdrawal for ${selectedMethod.name} is $${selectedMethod.min}.`);
      return;
    }
    if (amount > liveBalance) {
      setErrorMsg('Insufficient Live Balance for this withdrawal amount.');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMsg(`Please enter your ${selectedMethod.name} account number or wallet address.`);
      return;
    }

    setStep('PROCESSING');
    setTimeout(() => {
      const tx = createWithdrawal(
        amount,
        selectedMethod.name,
        destinationAddress.trim(),
        selectedMethod.network,
        payoutSpeedMode,
        accountHolderName.trim() || 'Verified Account Holder'
      );
      if (!tx) {
        setErrorMsg('Unable to process withdrawal. Please check your Live balance.');
        setStep('FORM');
        return;
      }
      setCreatedWithdrawalId(tx.id);
      setStep('SUCCESS');
    }, 900);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141722] border border-[#23293a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#23293a] bg-[#181c29] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff5252]/15 border border-[#ff5252]/40 flex items-center justify-center text-[#ff5252]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide text-white">
                  LIVE CASHIER • WITHDRAW FUNDS
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#00b85c]/20 text-[#00b85c] border border-[#00b85c]/30">
                  0% COMMISSION
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Available for Withdrawal:{' '}
                <span className="text-[#00b85c] font-mono font-bold">
                  ${liveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
                className="px-2.5 py-1.5 rounded-lg bg-[#1e2436] hover:bg-[#262d42] border border-[#2b3247] text-[11px] font-bold text-[#c9d1d9] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-[#00b85c]" />
                <span className="hidden sm:inline">Deposit</span>
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
          {step === 'FORM' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#ff3d3d]/15 border border-[#ff3d3d]/40 text-xs text-[#ff8080] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#ff3d3d] shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Withdrawal Method Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#8b949e]">
                    1. Select Payout Method
                  </label>
                  <span className="text-[10px] text-[#00b85c] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Instant Gateway
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WITHDRAW_METHODS.map((m) => {
                    const isSelected = selectedMethod.id === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMethod(m)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1c2336] border-[#00b85c] shadow-[0_0_15px_rgba(0,184,92,0.18)]'
                            : 'bg-[#181c29] border-[#23293a] hover:border-[#343d56]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg leading-none">{m.icon}</span>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#23293a] text-[#8b949e]">
                            0% FEE
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white truncate">{m.name}</div>
                        <div className="text-[10px] text-[#8b949e] truncate">{m.speed}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Withdrawal Amount */}
              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#8b949e]">
                    2. Withdrawal Amount (USD)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.floor(liveBalance * 100) / 100)}
                    className="text-[10px] font-black text-[#00b85c] hover:underline cursor-pointer"
                  >
                    MAX: ${liveBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-[#00b85c]">
                    $
                  </span>
                  <input
                    type="number"
                    min={selectedMethod.min}
                    max={liveBalance}
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#10131c] border border-[#2a3042] focus:border-[#00b85c] rounded-xl pl-8 pr-20 py-2.5 text-lg font-mono font-black text-white focus:outline-none"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b949e]">
                    USD
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {QUICK_WITHDRAW_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                        amount === val
                          ? 'bg-[#00b85c] border-[#00b85c] text-slate-950'
                          : 'bg-[#12151f] border-[#23293a] text-[#c9d1d9] hover:border-[#343d56]'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Destination Account & Holder Details */}
              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-3.5 space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#8b949e]">
                  3. Destination {selectedMethod.name} Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8b949e] mb-1">
                      Account Number / Wallet Address *
                    </label>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder={selectedMethod.placeholder}
                      className="w-full bg-[#10131c] border border-[#2a3042] focus:border-[#00b85c] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8b949e] mb-1">
                      Account Title / Recipient Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Muhammad Ali / Self"
                      className="w-full bg-[#10131c] border border-[#2a3042] focus:border-[#00b85c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Settlement Status Mode */}
                <div className="pt-2 border-t border-[#23293a] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Payout Settlement Status</div>
                    <div className="text-[10px] text-[#8b949e]">
                      {payoutSpeedMode === 'COMPLETED'
                        ? 'Instant Completed Payout Receipt'
                        : 'Show as Processing / Pending in History'}
                    </div>
                  </div>
                  <div className="flex bg-[#10131c] p-0.5 rounded-lg border border-[#23293a]">
                    <button
                      type="button"
                      onClick={() => setPayoutSpeedMode('COMPLETED')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                        payoutSpeedMode === 'COMPLETED'
                          ? 'bg-[#00b85c] text-slate-950'
                          : 'text-[#8b949e]'
                      }`}
                    >
                      INSTANT COMPLETED
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutSpeedMode('PENDING')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                        payoutSpeedMode === 'PENDING'
                          ? 'bg-[#f59e0b] text-slate-950'
                          : 'text-[#8b949e]'
                      }`}
                    >
                      PROCESSING
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Summary & Submit */}
              <div className="bg-[#10131c] border border-[#23293a] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e] font-bold">
                    Net Payout Amount (0% Fee)
                  </div>
                  <div className="text-xl font-mono font-black text-white">
                    ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8b949e] font-mono">
                    Remaining Live Balance: ${balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00b85c] to-[#00d66c] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center space-x-2 shadow-lg shadow-[#00b85c]/25 transition-all cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>CONFIRM WITHDRAWAL</span>
                </button>
              </div>
            </form>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-[#00b85c]/30 border-t-[#00b85c] animate-spin" />
              <div className="text-base font-black text-white">Executing Payout Transfer...</div>
              <p className="text-xs text-[#8b949e] max-w-xs">
                Verifying Live balance and dispatching ${amount.toFixed(2)} via {selectedMethod.name}.
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
                  {payoutSpeedMode === 'COMPLETED'
                    ? 'WITHDRAWAL SENT SUCCESSFULLY!'
                    : 'WITHDRAWAL REQUEST IN PROCESSING'}
                </div>
                <div className="text-2xl font-mono font-black text-[#00b85c]">
                  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-[#8b949e]">
                  <span>Reference ID:</span>
                  <span className="font-mono text-white font-bold">{createdWithdrawalId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(createdWithdrawalId)}
                    className="text-[#00b85c] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#181c29] border border-[#23293a] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Payout Method</span>
                  <span className="font-bold text-white">{selectedMethod.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Recipient Account / Address</span>
                  <span className="font-mono font-bold text-white">{destinationAddress}</span>
                </div>
                {accountHolderName && (
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Account Holder</span>
                    <span className="font-bold text-white">{accountHolderName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Updated Live Balance</span>
                  <span className="font-mono font-black text-[#00b85c]">
                    ${liveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2436] hover:bg-[#283048] text-xs font-bold text-white cursor-pointer"
                >
                  New Withdrawal
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
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Live Synchronized Recent Withdrawals Preview */}
          {recentWithdrawals.length > 0 && (
            <div className="pt-2 border-t border-[#23293a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8b949e]">
                  Recent Synchronized Withdrawals ({withdrawalTransactions.length})
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
                {recentWithdrawals.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-[#10131c] border border-[#23293a] rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          tx.status === 'COMPLETED'
                            ? 'bg-[#00b85c]'
                            : tx.status === 'PENDING'
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#ff3d3d]'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {tx.method} • <span className="font-mono text-[10px] text-[#8b949e]">{tx.address}</span>
                        </div>
                        <div className="text-[10px] text-[#8b949e]">
                          {tx.id} • {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {tx.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => updateWithdrawalStatus(tx.id, 'COMPLETED')}
                          className="px-2 py-0.5 rounded bg-[#00b85c]/20 hover:bg-[#00b85c]/30 text-[#00b85c] text-[10px] font-black cursor-pointer"
                        >
                          Mark Sent
                        </button>
                      )}
                      <div className="text-right">
                        <div className="font-mono font-black text-white">
                          -${tx.amount.toFixed(2)}
                        </div>
                        <div
                          className={`text-[9px] font-black uppercase ${
                            tx.status === 'COMPLETED'
                              ? 'text-[#00b85c]'
                              : tx.status === 'PENDING'
                              ? 'text-[#f59e0b]'
                              : 'text-[#ff3d3d]'
                          }`}
                        >
                          {tx.status}
                        </div>
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
