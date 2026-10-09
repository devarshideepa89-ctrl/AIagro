import React, { useState, useEffect } from "react";
import { cropFertilizerAPI, SoilClimatePayload } from "@/services/api";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";
import MobileLayout from "@/components/MobileLayout";
import { toast } from "sonner";
import {
  Sprout,
  FlaskConical,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Droplets,
  CloudRain,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface AnalysisResult {
  success: boolean;
  soilClimateInput: SoilClimatePayload;
  coordinatorSynthesis: {
    soilHealthScore: number;
    summary: string;
    insight: string;
    pipelineFlow: Array<{ step: number; name: string; status: string; detail: string }>;
  };
  cropAnalysis: {
    recommendedCrop: string;
    teluguName?: string;
    hindiName?: string;
    emoji: string;
    category: string;
    season: string;
    growthPeriod: string;
    waterRequirement: string;
    confidence: number;
    matchReason: string;
    alternatives: Array<{
      name: string;
      emoji: string;
      category: string;
      confidence: number;
      season: string;
    }>;
  };
  nutrientAnalysis: {
    current: { n: number; p: number; k: number; ph: number };
    required: { n: number; p: number; k: number; phRange: string };
    status: {
      n: { current: number; target: number; delta: number; status: string; level: string; severity: string; percentOfTarget: number };
      p: { current: number; target: number; delta: number; status: string; level: string; severity: string; percentOfTarget: number };
      k: { current: number; target: number; delta: number; status: string; level: string; severity: string; percentOfTarget: number };
      ph: { value: number; status: string; remedy: string | null };
    };
    deficiencies: string[];
    excesses: string[];
  };
  fertilizerRecommendation: {
    fertilizerType: string;
    dosage: string;
    dosagePerAcre: {
      urea: string;
      dap: string;
      mop: string;
      micronutrient?: string;
    };
    dosagePerHectare: {
      urea: string;
      dap: string;
      mop: string;
    };
    schedule: Array<{
      stage: string;
      timing: string;
      items: string[];
      purpose: string;
    }>;
    reason: string;
    micronutrients?: string;
  };
}

const PRESETS = [
  {
    id: "coastal_paddy",
    title: "Alluvial Delta (Paddy)",
    emoji: "🌾",
    data: { n: 90, p: 42, k: 43, ph: 6.5, temperature: 28, humidity: 75, rainfall: 950 }
  },
  {
    id: "black_cotton",
    title: "Black Soil (Cotton/Chilli)",
    emoji: "🏵️",
    data: { n: 95, p: 35, k: 65, ph: 7.6, temperature: 31, humidity: 55, rainfall: 650 }
  },
  {
    id: "red_loam",
    title: "Red Loam (Groundnut)",
    emoji: "🥜",
    data: { n: 25, p: 30, k: 35, ph: 6.4, temperature: 30, humidity: 50, rainfall: 550 }
  },
  {
    id: "dryland_rabi",
    title: "Dryland (Bengal Gram)",
    emoji: "🫘",
    data: { n: 28, p: 40, k: 25, ph: 7.2, temperature: 22, humidity: 45, rainfall: 320 }
  }
];

const CropFertilizerIntelligence = ({ hideLayout = false }: { hideLayout?: boolean }) => {
  const { language, coords, weatherData, weatherLoading } = useApp();
  const navigate = useNavigate();

  // Soil & Climate Inputs (Entered ONLY once)
  const [n, setN] = useState<number>(90);
  const [p, setP] = useState<number>(42);
  const [k, setK] = useState<number>(43);
  const [ph, setPh] = useState<number>(6.5);
  const [temperature, setTemperature] = useState<number>(28);
  const [humidity, setHumidity] = useState<number>(70);
  const [rainfall, setRainfall] = useState<number>(950);

  // Track whether climate fields were auto-filled from live weather
  const [weatherSynced, setWeatherSynced] = useState<boolean>(false);
  const [weatherFilling, setWeatherFilling] = useState<boolean>(false);

  // Flow state
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzingStep, setAnalyzingStep] = useState<number>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<boolean>(true);

  // ── Auto-fill climate fields from live dashboard weather on mount ──
  useEffect(() => {
    if (weatherData && !weatherSynced) {
      if (weatherData.temperature !== undefined) setTemperature(Math.round(weatherData.temperature));
      if (weatherData.humidity !== undefined) setHumidity(Math.round(weatherData.humidity));
      if (weatherData.rainfall !== undefined) setRainfall(Math.round(weatherData.rainfall));
      setWeatherSynced(true);
    }
  }, [weatherData, weatherSynced]);

  // Re-sync whenever live weather refreshes (every 10 min auto-refresh)
  useEffect(() => {
    if (weatherData && weatherSynced) {
      if (weatherData.temperature !== undefined) setTemperature(Math.round(weatherData.temperature));
      if (weatherData.humidity !== undefined) setHumidity(Math.round(weatherData.humidity));
      if (weatherData.rainfall !== undefined) setRainfall(Math.round(weatherData.rainfall));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherData?.lastUpdated]);

  // Manual re-sync button handler (reads from AppContext, no extra API call)
  const handleAutoFillWeather = () => {
    if (!weatherData) {
      toast.info("Live weather not available yet. Waiting for data...");
      return;
    }
    setWeatherFilling(true);
    if (weatherData.temperature !== undefined) setTemperature(Math.round(weatherData.temperature));
    if (weatherData.humidity !== undefined) setHumidity(Math.round(weatherData.humidity));
    if (weatherData.rainfall !== undefined) setRainfall(Math.round(weatherData.rainfall));
    setWeatherSynced(true);
    toast.success(
      `Weather synced from ${weatherData.location}: ${Math.round(weatherData.temperature)}°C, ${Math.round(weatherData.humidity)}% humidity, ${weatherData.rainfall} mm rainfall`
    );
    setTimeout(() => setWeatherFilling(false), 800);
  };

  const handleApplyPreset = (presetData: typeof PRESETS[0]["data"]) => {
    setN(presetData.n);
    setP(presetData.p);
    setK(presetData.k);
    setPh(presetData.ph);
    setTemperature(presetData.temperature);
    setHumidity(presetData.humidity);
    setRainfall(presetData.rainfall);
    toast.success("Soil and climate preset loaded.");
  };

  // Run Collective Intelligence analysis
  const handleAnalyze = async () => {
    setLoading(true);
    setAnalyzingStep(1);

    // Visual stepped simulation for collective agent collaboration
    const stepTimer1 = setTimeout(() => setAnalyzingStep(2), 500);
    const stepTimer2 = setTimeout(() => setAnalyzingStep(3), 1000);

    try {
      const payload: SoilClimatePayload = {
        n,
        p,
        k,
        ph,
        temperature,
        humidity,
        rainfall,
        language
      };
      const response = await cropFertilizerAPI.analyze(payload);
      if (response && response.success) {
        setResult(response);
        toast.success("Collective Intelligence Analysis complete!");
        // Scroll down to results smoothly
        setTimeout(() => {
          const resElement = document.getElementById("ci-results-section");
          if (resElement) resElement.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        toast.error(response?.error || "Analysis failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reach intelligence coordinator");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setAnalyzingStep(0);
    }
  };

  // Voice narration of findings
  const handleVoiceReadout = () => {
    if (!result) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `Crop and Fertilizer Recommendation. Recommended crop is ${result.cropAnalysis.recommendedCrop} with ${result.cropAnalysis.confidence} percent confidence. Recommended fertilizer is ${result.fertilizerRecommendation.fertilizerType}. Dosage: ${result.fertilizerRecommendation.dosage}. Reason: ${result.fertilizerRecommendation.reason}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.info("Reading recommendation aloud...");
    } else {
      toast.info("Text-to-speech not supported on this device.");
    }
  };

  const content = (
    <div className="space-y-5 pb-24 px-1">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-5 text-white shadow-elevated">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30 mb-2.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('collective_intelligence', language)}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{t('crop_fertilizer_title', language)}</span>
            </h1>
            <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed">
              {t('enter_once_desc', language)}
            </p>

            {/* Pipeline Step Tracker */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/70">
              <div className="flex items-center gap-1 font-medium text-emerald-300">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-bold text-[9px]">1</span>
                <span>Soil & Climate</span>
              </div>
              <ArrowRight className="h-3 w-3 text-white/40" />
              <div className="flex items-center gap-1 font-medium">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white font-bold text-[9px]">2</span>
                <span>Crop Agent</span>
              </div>
              <ArrowRight className="h-3 w-3 text-white/40" />
              <div className="flex items-center gap-1 font-medium">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white font-bold text-[9px]">3</span>
                <span>Fertilizer Agent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Fill Presets</span>
            {weatherData && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                Weather synced · {weatherData.location}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.data)}
                className="flex items-center gap-2 rounded-xl bg-card border border-border p-2.5 text-left text-xs font-medium text-foreground transition-all hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:scale-95"
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="truncate leading-tight">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Unified Input Card (Enter Once) */}
        <div className="rounded-3xl bg-card border border-border p-5 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-sm text-foreground">{t('soil_climate_input', language)}</h2>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Single Input Form
            </span>
          </div>

          {/* NPK Inputs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>🧪 Soil Nutrients (NPK in kg/ha)</span>
            </h3>

            {/* Nitrogen (N) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('nitrogen', language)}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {n} kg/ha
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 (Deficient)</span>
                <span>120 (Medium)</span>
                <span>250 (Rich)</span>
              </div>
            </div>

            {/* Phosphorus (P) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('phosphorus', language)}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {p} kg/ha
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="2"
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 (Low)</span>
                <span>50 (Adequate)</span>
                <span>120 (High)</span>
              </div>
            </div>

            {/* Potassium (K) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('potassium', language)}</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {k} kg/ha
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="2"
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0 (Low)</span>
                <span>60 (Optimum)</span>
                <span>150 (High)</span>
              </div>
            </div>

            {/* Soil pH */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{t('soil_ph', language)}</span>
                <span className={`font-bold px-2 py-0.5 rounded-md border text-xs ${
                  ph < 6.0
                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                    : ph > 7.5
                    ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
                    : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}>
                  pH {ph.toFixed(1)} ({ph < 6.0 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Neutral/Ideal"})
                </span>
              </div>
              <input
                type="range"
                min="4.5"
                max="9.0"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>4.5 (Acidic)</span>
                <span>6.5 - 7.0 (Neutral)</span>
                <span>9.0 (Alkaline)</span>
              </div>
            </div>
          </div>

          {/* Climate Parameters */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>🌤️ Environmental & Climate Conditions</span>
              </h3>
              {/* Live weather sync badge + button */}
              <button
                onClick={handleAutoFillWeather}
                disabled={weatherFilling || weatherLoading}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${weatherFilling || weatherLoading ? "animate-spin" : ""}`} />
                <span>{t('auto_fill_weather', language)}</span>
              </button>
            </div>

            {/* Live weather source banner */}
            {weatherData && weatherSynced && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700/40 px-3 py-2 text-xs">
                <span className="text-base">🌐</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sky-800 dark:text-sky-300">Live from dashboard weather</span>
                  <span className="ml-1 text-sky-600 dark:text-sky-400 truncate">
                    — {weatherData.location}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-700/30">
                  {weatherData.source || 'Live'}
                </span>
              </div>
            )}
            {weatherLoading && !weatherData && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
                <span>Fetching live weather for climate auto-fill...</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Temperature */}
              <div className="rounded-2xl bg-secondary/50 p-3 space-y-1 border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                    Temp
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    {temperature}°C
                    {weatherSynced && (
                      <span className="text-[9px] text-sky-500 font-semibold">live</span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  value={temperature}
                  onChange={(e) => { setTemperature(Number(e.target.value)); setWeatherSynced(false); }}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Humidity */}
              <div className="rounded-2xl bg-secondary/50 p-3 space-y-1 border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-sky-500" />
                    Humidity
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    {humidity}%
                    {weatherSynced && (
                      <span className="text-[9px] text-sky-500 font-semibold">live</span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="98"
                  step="1"
                  value={humidity}
                  onChange={(e) => { setHumidity(Number(e.target.value)); setWeatherSynced(false); }}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Rainfall */}
              <div className="rounded-2xl bg-secondary/50 p-3 space-y-1 border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                    Rainfall
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    {rainfall} mm
                    {weatherSynced && (
                      <span className="text-[9px] text-sky-500 font-semibold">live</span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="2000"
                  step="25"
                  value={rainfall}
                  onChange={(e) => { setRainfall(Number(e.target.value)); setWeatherSynced(false); }}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Run Analysis Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 py-3.5 px-4 text-center text-sm font-bold text-white shadow-elevated transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>
                  {analyzingStep === 1
                    ? "Crop Agent Analyzing Climate..."
                    : analyzingStep === 2
                    ? "Fertilizer Agent Calculating Nutrients..."
                    : "Coordinator Synthesizing Results..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t('analyze_now', language)}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Collective Intelligence Result Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              id="ci-results-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Coordinator Synthesis Banner */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white p-5 shadow-elevated border border-emerald-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t('coordinator_synthesis', language)}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Collective Recommendation for {result.cropAnalysis.recommendedCrop}
                    </h3>
                  </div>

                  {/* Soil Health Score Meter */}
                  <div className="flex flex-col items-center bg-white/10 rounded-2xl px-3 py-2 border border-white/10 shrink-0">
                    <span className="text-[10px] text-emerald-300 uppercase font-semibold">Soil Health</span>
                    <span className="text-xl font-extrabold text-white">
                      {result.coordinatorSynthesis.soilHealthScore}
                      <span className="text-xs font-normal text-white/60">/100</span>
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-emerald-100/90 bg-emerald-500/10 rounded-2xl p-3 border border-emerald-400/20">
                  💡 {result.coordinatorSynthesis.insight}
                </p>

                {/* Actions: Voice & Share */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={handleVoiceReadout}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Listen Aloud (Voice)</span>
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `AgroSmart Crop & Fertilizer Plan for ${result.cropAnalysis.recommendedCrop}`,
                          text: `Recommended Crop: ${result.cropAnalysis.recommendedCrop} (${result.cropAnalysis.confidence}% confidence). Fertilizer: ${result.fertilizerRecommendation.fertilizerType} (${result.fertilizerRecommendation.dosage})`
                        }).catch(() => {});
                      } else {
                        toast.success("Summary copied to clipboard!");
                        navigator.clipboard.writeText(`Recommended Crop: ${result.cropAnalysis.recommendedCrop}. Fertilizer: ${result.fertilizerRecommendation.dosage}`);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* 1. RECOMMENDED CROP CARD */}
              <div className="rounded-3xl bg-card border border-border p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-sm text-foreground">
                      🌱 {t('recommended_crop', language)}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Agent 1: Crop Specialist
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/30 text-4xl shadow-inner border border-emerald-500/20">
                    {result.cropAnalysis.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-extrabold text-foreground truncate">
                      {result.cropAnalysis.recommendedCrop}
                    </h4>
                    {result.cropAnalysis.teluguName && (
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {result.cropAnalysis.teluguName}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        {result.cropAnalysis.season}
                      </span>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {result.cropAnalysis.category}
                      </span>
                      <span className="rounded-full bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:text-sky-300">
                        💧 {result.cropAnalysis.waterRequirement} Water
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1.5 rounded-2xl bg-secondary/40 p-3 border border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span>{t('confidence_score', language)}</span>
                    </span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      {result.cropAnalysis.confidence}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.cropAnalysis.confidence}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                    {result.cropAnalysis.matchReason}
                  </p>
                </div>

                {/* Alternative Candidates */}
                {result.cropAnalysis.alternatives?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Alternative Candidate Crops:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {result.cropAnalysis.alternatives.map((alt) => (
                        <div
                          key={alt.name}
                          className="rounded-xl bg-card border border-border p-2 text-center text-xs"
                        >
                          <span className="text-xl block">{alt.emoji}</span>
                          <span className="font-semibold text-foreground block truncate mt-1">{alt.name}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{alt.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. NUTRIENT GAP ANALYSIS (Current NPK vs Required NPK) */}
              <div className="rounded-3xl bg-card border border-border p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-teal-600" />
                    <h3 className="font-bold text-sm text-foreground">
                      🧪 {t('nutrient_gaps', language)}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Agent 2: Soil Chemist
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Current Soil Values */}
                  <div className="rounded-2xl bg-secondary/50 p-3 space-y-1.5 border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      {t('current_npk', language)}
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">N:</span>
                        <span className="font-bold text-foreground">{result.nutrientAnalysis.current.n} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">P:</span>
                        <span className="font-bold text-foreground">{result.nutrientAnalysis.current.p} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">K:</span>
                        <span className="font-bold text-foreground">{result.nutrientAnalysis.current.k} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">pH:</span>
                        <span className="font-bold text-foreground">{result.nutrientAnalysis.current.ph}</span>
                      </div>
                    </div>
                  </div>

                  {/* Required Nutrients for Selected Crop */}
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-1.5 border border-emerald-500/20">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                      {t('required_nutrients', language)}
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-900/70 dark:text-emerald-200/70">N (Target):</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{result.nutrientAnalysis.required.n} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-900/70 dark:text-emerald-200/70">P (Target):</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{result.nutrientAnalysis.required.p} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-900/70 dark:text-emerald-200/70">K (Target):</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{result.nutrientAnalysis.required.k} kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-900/70 dark:text-emerald-200/70">pH Range:</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">{result.nutrientAnalysis.required.phRange}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deficiencies or Excesses Alert Cards */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-foreground block">
                    ⚠️ Detected Deficits & Excesses:
                  </span>
                  {result.nutrientAnalysis.deficiencies?.length > 0 ? (
                    <div className="space-y-1.5">
                      {result.nutrientAnalysis.deficiencies.map((d, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/40 p-2.5 text-xs text-amber-900 dark:text-amber-200"
                        >
                          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>No severe deficiencies detected. Soil reserves are well balanced!</span>
                    </div>
                  )}

                  {result.nutrientAnalysis.excesses?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {result.nutrientAnalysis.excesses.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800/40 p-2.5 text-xs text-sky-900 dark:text-sky-200"
                        >
                          <Info className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. FERTILIZER RECOMMENDATION AGENT CARD */}
              <div className="rounded-3xl bg-card border border-border p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-sm text-foreground">
                      💊 {t('recommended_fertilizer', language)}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Agent 3: Fertilizer Expert
                  </span>
                </div>

                {/* Fertilizer Type */}
                <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                    Recommended Fertilizer Formulation:
                  </span>
                  <p className="text-base font-bold text-indigo-950 dark:text-indigo-100">
                    {result.fertilizerRecommendation.fertilizerType}
                  </p>
                </div>

                {/* Fertilizer Dosage */}
                <div className="rounded-2xl bg-secondary/50 border border-border p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      📏 {t('recommended_dosage', language)} (Per Acre)
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">Standard Field Rate</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-card p-2 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Urea (46% N)</span>
                      <span className="text-xs font-bold text-foreground block mt-0.5">
                        {result.fertilizerRecommendation.dosagePerAcre.urea}
                      </span>
                    </div>
                    <div className="rounded-xl bg-card p-2 border border-border">
                      <span className="text-[10px] text-muted-foreground block">DAP (18-46-0)</span>
                      <span className="text-xs font-bold text-foreground block mt-0.5">
                        {result.fertilizerRecommendation.dosagePerAcre.dap}
                      </span>
                    </div>
                    <div className="rounded-xl bg-card p-2 border border-border">
                      <span className="text-[10px] text-muted-foreground block">MOP (60% K)</span>
                      <span className="text-xs font-bold text-foreground block mt-0.5">
                        {result.fertilizerRecommendation.dosagePerAcre.mop}
                      </span>
                    </div>
                  </div>

                  {result.fertilizerRecommendation.micronutrients && (
                    <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/20">
                      🌿 <strong>Micronutrients:</strong> {result.fertilizerRecommendation.micronutrients}
                    </div>
                  )}
                </div>

                {/* Reason for Fertilizer Recommendation */}
                <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-800/40 p-3.5 space-y-1">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>💡 {t('fertilizer_reason', language)}</span>
                  </span>
                  <p className="text-xs text-amber-950/90 dark:text-amber-100/90 leading-relaxed pt-1">
                    {result.fertilizerRecommendation.reason}
                  </p>
                </div>

                {/* Staged Application Schedule */}
                {result.fertilizerRecommendation.schedule?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setExpandedSchedule(!expandedSchedule)}
                      className="flex w-full items-center justify-between text-xs font-bold text-foreground hover:text-emerald-600 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span>{t('application_schedule', language)}</span>
                      </span>
                      {expandedSchedule ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {expandedSchedule && (
                      <div className="space-y-2 pt-1">
                        {result.fertilizerRecommendation.schedule.map((stg, i) => (
                          <div
                            key={i}
                            className="rounded-2xl bg-secondary/40 border border-border/60 p-3 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-semibold text-foreground">
                              <span>{stg.stage}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {stg.timing}
                              </span>
                            </div>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                              {stg.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{item}</li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 italic pt-0.5">
                              Goal: {stg.purpose}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Find Nearby Stores CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => navigate("/stores")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card border-2 border-emerald-600 py-3 px-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm transition-transform active:scale-[0.98] hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>Locate Fertilizer Stores Nearby</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );

  return hideLayout ? content : <MobileLayout>{content}</MobileLayout>;
};

export default CropFertilizerIntelligence;
