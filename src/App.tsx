import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Leaf, 
  Droplets, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Calendar,
  Clock,
  ChevronDown,
  Info,
  Calculator,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Settings2,
  X,
  TrendingUpDown,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ThingSpeakResponse, DashboardData } from './types';
import { INDIAN_CROPS, CropNPK } from './constants';

const DEFAULT_CHANNEL_ID = '3317714';
const REFRESH_INTERVAL = 30000; // 30 seconds

export default function App() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropNPK>(INDIAN_CROPS[0]);
  const [channelId, setChannelId] = useState(DEFAULT_CHANNEL_ID);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualNPK, setManualNPK] = useState({ n: 45, p: 20, k: 30 });
  const [area, setArea] = useState(1);
  const [areaUnit, setAreaUnit] = useState<'hectare' | 'acre'>('hectare');
  const [showReport, setShowReport] = useState(false);
  const [timelineView, setTimelineView] = useState<'live' | 'daily' | 'weekly'>('live');

  const fetchData = async () => {
    if (isManualMode) return;
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=30`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from ThingSpeak');
      }

      const json: ThingSpeakResponse = await response.json();
      
      const formattedData: DashboardData[] = json.feeds.map(feed => ({
        timestamp: feed.created_at,
        nitrogen: parseFloat(feed.field1 || '0'),
        phosphorus: parseFloat(feed.field2 || '0'),
        potassium: parseFloat(feed.field3 || '0'),
      }));

      setData(formattedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [channelId, isManualMode]);

  const currentNPK = useMemo(() => {
    if (isManualMode) return manualNPK;
    const latest = data[data.length - 1];
    return latest ? { n: latest.nitrogen, p: latest.phosphorus, k: latest.potassium } : { n: 0, p: 0, k: 0 };
  }, [data, isManualMode, manualNPK]);

  const comparisonData = useMemo(() => [
    { name: 'Nitrogen (N)', current: currentNPK.n, required: selectedCrop.n, unit: 'mg/kg' },
    { name: 'Phosphorus (P)', current: currentNPK.p, required: selectedCrop.p, unit: 'mg/kg' },
    { name: 'Potassium (K)', current: currentNPK.k, required: selectedCrop.k, unit: 'mg/kg' },
  ], [currentNPK, selectedCrop]);

  const calculations = useMemo(() => {
    const areaInHectares = areaUnit === 'hectare' ? area : area / 2.471;
    
    const deficitN = Math.max(0, selectedCrop.n - currentNPK.n);
    const deficitP = Math.max(0, selectedCrop.p - currentNPK.p);
    const deficitK = Math.max(0, selectedCrop.k - currentNPK.k);

    // Simplified fertilizer calculations
    // Urea: 46% N
    // DAP: 18% N, 46% P (simplified as primary P source)
    // MOP: 60% K
    const ureaNeeded = (deficitN / 0.46) * areaInHectares;
    const dapNeeded = (deficitP / 0.46) * areaInHectares;
    const mopNeeded = (deficitK / 0.60) * areaInHectares;

    return {
      n: { deficit: deficitN, urea: ureaNeeded },
      p: { deficit: deficitP, dap: dapNeeded },
      k: { deficit: deficitK, mop: mopNeeded },
      areaInHectares
    };
  }, [currentNPK, selectedCrop, area, areaUnit]);

  const chartData = useMemo(() => {
    if (timelineView === 'live') {
      return data.map(d => ({
        ...d,
        displayTime: format(new Date(d.timestamp), 'HH:mm:ss'),
      }));
    }

    // Aggregate data for Daily/Weekly views
    const grouped = data.reduce((acc: any, curr) => {
      const date = timelineView === 'daily' 
        ? format(new Date(curr.timestamp), 'MMM dd')
        : format(new Date(curr.timestamp), 'MMM dd'); // For small datasets, weekly might look similar to daily
      
      if (!acc[date]) {
        acc[date] = { time: date, nitrogen: 0, phosphorus: 0, potassium: 0, count: 0 };
      }
      acc[date].nitrogen += curr.nitrogen;
      acc[date].phosphorus += curr.phosphorus;
      acc[date].potassium += curr.potassium;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).map((g: any) => ({
      displayTime: g.time,
      nitrogen: g.nitrogen / g.count,
      phosphorus: g.phosphorus / g.count,
      potassium: g.potassium / g.count,
    }));
  }, [data, timelineView]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-200">
      {/* Header - Ultra Vibrant */}
      <header className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 sticky top-0 z-50 shadow-2xl shadow-emerald-200/50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-2xl border border-white/30 shadow-inner">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">Agri-NPK <span className="text-emerald-100 italic">Pro</span></h1>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-100 uppercase tracking-widest">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                Live Intelligence // Indian Crops
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-black/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 font-bold text-[11px]">
              <button 
                onClick={() => setIsManualMode(false)}
                className={`px-5 py-2 rounded-xl transition-all ${!isManualMode ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                LIVE DATA
              </button>
              <button 
                onClick={() => setIsManualMode(true)}
                className={`px-5 py-2 rounded-xl transition-all ${isManualMode ? 'bg-white text-emerald-600 shadow-lg' : 'text-white/70 hover:text-white'}`}
              >
                SIMULATOR
              </button>
            </div>

            {/* Crop Selector */}
            <div className="relative">
              <select 
                value={selectedCrop.name}
                onChange={(e) => setSelectedCrop(INDIAN_CROPS.find(c => c.name === e.target.value) || INDIAN_CROPS[0])}
                className="appearance-none bg-white text-emerald-700 border-none px-8 py-2.5 pr-12 rounded-2xl font-black text-sm focus:outline-none focus:ring-4 focus:ring-white/20 cursor-pointer shadow-xl transition-all hover:scale-105"
              >
                {INDIAN_CROPS.map(crop => (
                  <option key={crop.name} value={crop.name} className="text-slate-900 bg-white">{crop.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3 font-black text-[11px] text-white/80 bg-black/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <Clock className="w-4 h-4 text-white" />
              <span>{lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '--:--:--'}</span>
              <button 
                onClick={fetchData}
                disabled={loading || isManualMode}
                className={`p-1 rounded-lg hover:bg-white/10 transition-all ${loading ? 'animate-spin text-white' : 'text-white/60'}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Left Column: Real-time Stats & Manual Input */}
        <div className="xl:col-span-4 space-y-10">
          {/* Current Status Cards */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Soil Health Metrics</h2>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
              </div>
            </div>
            
            {[
              { label: 'Nitrogen', value: currentNPK.n, icon: Leaf, color: 'emerald', key: 'n', gradient: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50', border: 'border-emerald-100', shadow: 'shadow-emerald-100' },
              { label: 'Phosphorus', value: currentNPK.p, icon: Droplets, color: 'blue', key: 'p', gradient: 'from-blue-500 to-indigo-500', light: 'bg-blue-50', border: 'border-blue-100', shadow: 'shadow-blue-100' },
              { label: 'Potassium', value: currentNPK.k, icon: Zap, color: 'amber', key: 'k', gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-100', shadow: 'shadow-amber-100' },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`bg-white border-2 ${stat.border} p-8 rounded-[2rem] shadow-2xl ${stat.shadow} relative overflow-hidden group`}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest text-${stat.color}-600 mb-2`}>{stat.label} (N)</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter text-slate-900">
                        {stat.value.toFixed(1)}
                      </span>
                      <span className="text-sm font-black text-slate-300 uppercase">mg/kg</span>
                    </div>
                  </div>
                  <div className={`p-5 rounded-3xl ${stat.light} shadow-inner`}>
                    <stat.icon className={`w-10 h-10 text-${stat.color}-500`} />
                  </div>
                </div>
                
                {isManualMode && (
                  <div className="mt-8 pt-8 border-t border-slate-50">
                    <input 
                      type="range" 
                      min="0" 
                      max="300" 
                      value={stat.value}
                      onChange={(e) => setManualNPK(prev => ({ ...prev, [stat.key]: parseFloat(e.target.value) }))}
                      className={`w-full h-3 rounded-full appearance-none cursor-pointer accent-${stat.color}-500 bg-slate-100 shadow-inner`}
                    />
                  </div>
                )}
                
                {/* Visual indicator of status vs required */}
                <div className="mt-8">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                    <span>Soil Saturation</span>
                    <span className={`text-${stat.color}-600`}>{Math.min(100, (stat.value / (selectedCrop as any)[stat.key]) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stat.value / (selectedCrop as any)[stat.key]) * 100)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} shadow-lg shadow-${stat.color}-200`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Configuration / Channel Settings */}
          <section className="bg-white border-2 border-slate-100 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/30">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Settings2 className="w-6 h-6 text-slate-600" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">System Config</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ThingSpeak Channel ID</label>
                <input 
                  type="text" 
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  disabled={isManualMode}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl font-black text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Land Area Configuration</label>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl font-black text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-sm"
                  />
                  <select 
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as 'hectare' | 'acre')}
                    className="bg-slate-50 border-2 border-slate-100 px-5 py-4 rounded-2xl font-black text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-sm"
                  >
                    <option value="hectare">Hectares</option>
                    <option value="acre">Acres</option>
                  </select>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Crop Intelligence</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-300">
                    {selectedCrop.description}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Comparison & Calculator */}
        <div className="xl:col-span-8 space-y-10">
          {/* Comparison Chart */}
          <section className="bg-white border-2 border-slate-50 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Requirement Gap</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Current Soil vs {selectedCrop.name} Target</p>
              </div>
              <div className="flex items-center gap-8 font-black text-[10px] uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg shadow-emerald-100" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-100 rounded-lg" />
                  <span>Required</span>
                </div>
              </div>
            </div>

            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="12 12" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 900 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 20 }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none',
                      borderRadius: '24px',
                      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                      padding: '20px'
                    }}
                  />
                  <Bar dataKey="current" name="Current Level" fill="url(#barGradient)" radius={[15, 15, 0, 0]} barSize={70} />
                  <Bar dataKey="required" name="Required Level" fill="#f1f5f9" radius={[15, 15, 0, 0]} barSize={70} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Fertilizer Calculator Dashboard */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-12 rounded-[4rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -ml-64 -mb-64" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                <div className="p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                  <Calculator className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tight">Fertilizer Prescription</h2>
                  <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-1">AI-Driven Nutrient Optimization</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { 
                    label: 'Nitrogen Deficit', 
                    value: calculations.n.deficit, 
                    source: 'Urea', 
                    amount: calculations.n.urea, 
                    icon: TrendingDown,
                    color: 'emerald',
                    glow: 'shadow-emerald-500/20'
                  },
                  { 
                    label: 'Phosphorus Deficit', 
                    value: calculations.p.deficit, 
                    source: 'DAP', 
                    amount: calculations.p.dap, 
                    icon: TrendingDown,
                    color: 'blue',
                    glow: 'shadow-blue-500/20'
                  },
                  { 
                    label: 'Potassium Deficit', 
                    value: calculations.k.deficit, 
                    source: 'MOP', 
                    amount: calculations.k.mop, 
                    icon: TrendingDown,
                    color: 'amber',
                    glow: 'shadow-amber-500/20'
                  },
                ].map((calc) => (
                  <div key={calc.label} className={`bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group shadow-2xl ${calc.glow}`}>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{calc.label}</span>
                      {calc.value > 0 ? <calc.icon className={`w-6 h-6 text-${calc.color}-400`} /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                    </div>
                    
                    <div className="mb-10">
                      <div className="text-5xl font-black tracking-tighter">
                        {calc.value.toFixed(1)} <span className="text-xs font-black text-white/20 uppercase">mg/kg</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                        <span className="text-white/20">Recommended Source</span>
                        <span className={`text-${calc.color}-400 bg-${calc.color}-400/10 px-3 py-1 rounded-full`}>{calc.source}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/20">Total Quantity</span>
                        <span className="text-3xl font-black text-emerald-400">{calc.amount.toFixed(1)} <span className="text-xs">kg</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-5 text-base font-bold text-white/30">
                  <Info className="w-6 h-6 text-emerald-500" />
                  <span>Calculations optimized for {area} {areaUnit}(s) based on ICAR standards.</span>
                </div>
                <button 
                  onClick={() => setShowReport(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                >
                  Generate Full Report <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </section>

          {/* Report Modal */}
          <AnimatePresence>
            {showReport && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                onClick={() => setShowReport(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 40, opacity: 0 }}
                  className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] relative my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setShowReport(false)}
                    className="absolute top-6 right-6 md:top-12 md:right-12 z-[110] p-4 bg-white/80 backdrop-blur-md rounded-3xl hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-all text-slate-400 shadow-2xl border border-slate-100 group active:scale-95"
                  >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                  </button>

                  <div className="p-10 md:p-20">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-16 pb-12 border-b border-slate-100">
                      <div className="p-6 bg-emerald-500 rounded-[2rem] shadow-2xl shadow-emerald-200">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Fertilizer Report</h2>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Generated: {format(new Date(), 'PPP')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                      <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Field Summary</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-500">Selected Crop</span>
                              <span className="text-emerald-600">{selectedCrop.name}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-500">Total Area</span>
                              <span className="text-slate-900">{area} {areaUnit}(s)</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-500">Soil Status</span>
                              <span className="text-slate-900">Analysis Complete</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-900 p-8 rounded-[2rem] text-white">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">Total Fertilizer Required</h3>
                          <div className="space-y-6">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-emerald-300">Urea (Nitrogen)</span>
                              <span className="text-3xl font-black">{calculations.n.urea.toFixed(1)} <span className="text-xs opacity-50">kg</span></span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-emerald-300">DAP (Phosphorus)</span>
                              <span className="text-3xl font-black">{calculations.p.dap.toFixed(1)} <span className="text-xs opacity-50">kg</span></span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-emerald-300">MOP (Potassium)</span>
                              <span className="text-3xl font-black">{calculations.k.mop.toFixed(1)} <span className="text-xs opacity-50">kg</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">Application Schedule</h3>
                          <div className="space-y-6 relative z-10">
                            <div className="flex gap-4">
                              <div className="w-1 h-12 bg-emerald-500 rounded-full" />
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Phase 1: Basal Dose</div>
                                <p className="text-sm font-medium text-slate-400">Apply 50% Urea and 100% DAP/MOP during sowing.</p>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <div className="w-1 h-12 bg-slate-700 rounded-full" />
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Phase 2: Top Dressing</div>
                                <p className="text-sm font-medium text-slate-400">Apply remaining Urea in 2 split doses after 30 and 60 days.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem]">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Expert Tip</h3>
                          <p className="text-sm font-medium text-slate-500 italic">
                            "Ensure soil moisture is adequate before application. Avoid applying fertilizers during heavy rainfall to prevent leaching."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <button 
                        onClick={() => setShowReport(false)}
                        className="flex-1 bg-emerald-500 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-100"
                      >
                        Close Dashboard
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historical Trend */}
          {!isManualMode && data.length > 0 && (
            <section className="bg-white border-2 border-slate-50 p-12 rounded-[4rem] shadow-2xl shadow-slate-200/30">
              <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <History className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sensor Timeline</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trend Analysis for Channel #{channelId}</p>
                  </div>
                </div>
                
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {(['live', 'daily', 'weekly'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setTimelineView(view)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        timelineView === view 
                          ? 'bg-white text-emerald-600 shadow-md' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="15 15" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayTime" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: 'none', 
                        borderRadius: '24px', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                        padding: '20px'
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Line type="monotone" name="Nitrogen" dataKey="nitrogen" stroke="#10b981" strokeWidth={5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} strokeLinecap="round" />
                    <Line type="monotone" name="Phosphorus" dataKey="phosphorus" stroke="#3b82f6" strokeWidth={5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} strokeLinecap="round" />
                    <Line type="monotone" name="Potassium" dataKey="potassium" stroke="#f59e0b" strokeWidth={5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} strokeLinecap="round" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-32 py-32 px-6">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-2">
            <div className="flex items-center gap-5 mb-8">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-xl shadow-emerald-200">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">Agri-NPK Pro</span>
            </div>
            <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-lg italic font-serif">
              "Empowering Indian agriculture through data-driven soil intelligence. Our platform bridges the gap between traditional farming and modern technology."
            </p>
          </div>
          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Knowledge Base</h4>
            <ul className="text-base font-bold text-slate-400 space-y-6">
              <li><a href="https://soilhealth.dac.gov.in/" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-2">Soil Health Card Portal <ArrowRight className="w-4 h-4" /></a></li>
              <li><a href="https://icar.org.in/" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-2">ICAR Official Website <ArrowRight className="w-4 h-4" /></a></li>
              <li><a href="https://pmkisan.gov.in/" target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-2">PM-Kisan Dashboard <ArrowRight className="w-4 h-4" /></a></li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Infrastructure</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm font-black uppercase">
                <span className="text-slate-300">API Status</span>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">Operational</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black uppercase">
                <span className="text-slate-300">Node Sync</span>
                <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
