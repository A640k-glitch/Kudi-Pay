import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';

// ── Animated counter ───────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return value;
}

// ── Data ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: 10000, label: 'Merchants', suffix: '+', note: 'Across 36 states' },
  { value: 84000, label: 'Orders', suffix: '+', note: 'Fulfilled on platform' },
  { value: 9200,  label: 'Trust Scores', suffix: '+', note: 'Issued & growing' },
  { value: 2300,  label: 'Loans Disbursed', suffix: '+', note: 'Interest-free capital' },
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Open your storefront',
    body: 'Enter your business name, pick your category. Kudi generates your custom link and live product page instantly — no code, no waiting.',
    accent: 'bg-indigo-950',
    tag: 'Commerce',
  },
  {
    num: '02',
    title: 'Every sale is recorded',
    body: 'Sales, expenses, and supplier invoices — Kudi captures them all automatically. Snap a receipt and our AI posts it directly to your ledger.',
    accent: 'bg-emerald-950',
    tag: 'Ledger',
  },
  {
    num: '03',
    title: 'Your score builds itself',
    body: 'Consistent trading history generates your Kudi Trust Score. A verifiable, growing number that proves your business is real.',
    accent: 'bg-violet-950',
    tag: 'Credit',
  },
  {
    num: '04',
    title: 'Capital unlocks automatically',
    body: 'Hit a score threshold and overdrafts, micro-loans, and extended credit become available in your dashboard — no applications, no queues.',
    accent: 'bg-amber-950',
    tag: 'Capital',
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [statsOn, setStatsOn] = useState<boolean>(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1E1B4B] overflow-x-hidden">

      {/* ── FROSTED NAV ── */}
      <header className="fixed inset-x-0 top-2 md:top-5 z-50 px-4">
        <nav className="mx-auto flex w-full max-w-[1100px] items-center justify-between rounded-2xl border border-gray-200/80 bg-white/95 px-5 py-3 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-8">
            <Link to="/"><Logo className="h-8" /></Link>
            <div className="hidden md:flex items-center gap-6">
              {['Storefronts', 'Loans', 'Trust Score'].map(l => (
                <Link key={l} to="/" className="text-sm font-medium text-gray-500 hover:text-[#1E1B4B] transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-medium text-gray-500 hover:text-[#1E1B4B] transition-colors px-3 py-2">Log In</Link>
            <Link to="/signup">
              <button className="h-10 px-6 rounded-lg bg-[#1E1B4B] text-sm font-semibold text-white hover:bg-[#111827] transition-all shadow-sm">
                Open Store
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">

        {/* ── DYNAMIC PREMIUM HERO ── */}
        <section className="relative px-6 pt-32 pb-24 md:pt-40 md:pb-32 bg-[#1E1B4B] overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-white/10 border border-white/20 w-fit backdrop-blur-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">Commerce & Credit Infrastructure</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white">
                Your business, <br className="hidden md:block" /> built to scale.
              </h1>
              <p className="text-lg md:text-xl text-indigo-100/80 leading-relaxed max-w-lg">
                Nigerian merchants use Kudi to open instant storefronts, track sales automatically, and build a Trust Score that unlocks capital.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to="/signup">
                  <button className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-sm font-bold text-[#1E1B4B] hover:bg-gray-100 transition-colors shadow-xl w-full sm:w-auto">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-white/20 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-full sm:w-auto">
                    Log in
                  </button>
                </Link>
              </div>
            </div>

            {/* Premium App Preview Card with 3D feel */}
            <div className="relative mt-12 lg:mt-0 perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 rounded-3xl blur-2xl transform translate-y-4" />
              
              <div className="relative bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 p-8 overflow-hidden transform md:-rotate-y-12 md:rotate-x-12 transition-transform hover:rotate-0 duration-700 ease-out">
                {/* Simulated Dashboard Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5">Available Balance</p>
                    <p className="text-3xl font-bold text-white">₦148,000</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">Trust Score</p>
                    <p className="text-2xl font-bold text-emerald-500 flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-4 h-4" /> 640
                    </p>
                  </div>
                </div>
                
                {/* Simulated Credit Module */}
                <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Unlocking ₦50k Overdraft</span>
                    <span className="text-sm font-bold text-indigo-400">70%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-black/50 overflow-hidden border border-white/5">
                    <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" />
                  </div>
                  <p className="text-xs text-indigo-200/60 mt-2">Continue trading to unlock your first credit facility.</p>
                </div>
                
                {/* Floating Notification */}
                <div className="absolute -right-4 top-24 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 p-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce shadow-emerald-500/20 hidden md:flex">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sale Recorded</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STAT BAR ── */}
        <div ref={statsRef} className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((s, i) => (
              <StatCell key={i} stat={s} active={statsOn} />
            ))}
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1E1B4B] leading-tight mb-4">
                Everything you need to run and grow your commerce business.
              </h2>
              <p className="text-lg text-gray-600">Built securely on robust infrastructure to give you peace of mind.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {HOW_IT_WORKS.map((item, index) => (
                <div key={item.num} className="p-8 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-gray-50/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#1E1B4B] flex items-center justify-center text-white font-bold text-sm">
                      {item.num}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#1E1B4B]">{item.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1E1B4B] mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FLOATING CTA — sits above footer with overlap ── */}
        <div className="px-4 md:px-8 pb-0 -mb-8 relative z-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="relative overflow-hidden bg-[#1E1B4B] rounded-2xl md:rounded-3xl px-8 py-10 md:px-14 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl shadow-indigo-950/30">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
              </div>
              <div className="relative z-10 max-w-md">
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-2">
                  Your store is one link away.
                </h2>
                <p className="text-sm text-white/50">Free to start. No setup fee. Your financial record builds itself.</p>
              </div>
              <Link to="/signup" className="relative z-10 shrink-0">
                <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-[#1E1B4B] hover:bg-gray-100 transition-colors shadow-sm">
                  Open Free Store <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}

// ── Stat Cell ──────────────────────────────────────────────────────────────
interface StatCellProps { stat: typeof STATS[0]; active: boolean; }
const StatCell: React.FC<StatCellProps> = ({ stat, active }) => {
  const raw = useCountUp(stat.value, 2000, active);
  const display = raw >= 1000 ? `${(raw / 1000).toFixed(raw >= 10000 ? 0 : 1)}k` : raw.toString();
  return (
    <div className="flex flex-col gap-1 px-0 md:px-8 first:pl-0 last:pr-0">
      <span className="text-3xl md:text-4xl font-bold text-[#1E1B4B] tracking-tight tabular-nums">
        {display}{stat.suffix}
      </span>
      <span className="text-sm font-semibold text-[#1E1B4B]">{stat.label}</span>
      <span className="text-xs text-gray-400">{stat.note}</span>
    </div>
  );
};
