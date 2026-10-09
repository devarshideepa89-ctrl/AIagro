/**
 * Crop & Fertilizer Collective Intelligence Module
 * 
 * Orchestrates:
 * 1. Crop Recommendation Agent (Soil & Climate -> Best Crop + Confidence)
 * 2. Fertilizer Recommendation Agent (Selected Crop + Soil NPK Delta -> Exact Fertilizer Type, Dosage, Schedule, Reason)
 * 3. Central AI Coordinator (Synthesizes pipeline findings into unified collective intelligence recommendation)
 */

// ── Comprehensive Agronomic Knowledge Base ───────────────────────
const CROP_PROFILES = [
  {
    id: 'rice',
    name: 'Paddy (Rice)',
    teluguName: 'వరి (వరి ధాన్యం)',
    hindiName: 'धान (चावल)',
    emoji: '🌾',
    category: 'Cereal / Grain',
    season: 'Kharif',
    targetNPK: { n: 135, p: 60, k: 60 }, // optimal targets in kg/ha
    optimalRanges: {
      n: [100, 160],
      p: [40, 75],
      k: [40, 75],
      ph: [5.5, 7.5],
      temp: [20, 36],
      humidity: [65, 95],
      rainfall: [800, 2200],
    },
    baseDosageAcre: { urea: 65, dap: 40, mop: 25 },
    micronutrients: 'Zinc Sulphate (ZnSO₄ 21%): 10 kg/acre (basal to prevent Khaira disease)',
    growthPeriod: '120-150 days',
    waterRequirement: 'High',
    description: 'High-yielding staple cereal suited for humid, warm climates with standing water or assured irrigation.'
  },
  {
    id: 'cotton',
    name: 'Cotton',
    teluguName: 'ప్రత్తి',
    hindiName: 'कपास',
    emoji: '🏵️',
    category: 'Cash Crop / Fibre',
    season: 'Kharif',
    targetNPK: { n: 120, p: 60, k: 60 },
    optimalRanges: {
      n: [90, 145],
      p: [35, 70],
      k: [35, 70],
      ph: [6.0, 8.0],
      temp: [21, 36],
      humidity: [45, 75],
      rainfall: [500, 900],
    },
    baseDosageAcre: { urea: 60, dap: 40, mop: 30 },
    micronutrients: 'Boron (Borax): 4 kg/acre + Magnesium Sulphate: 10 kg/acre against leaf reddening',
    growthPeriod: '150-180 days',
    waterRequirement: 'Moderate',
    description: 'Deep-rooted commercial fibre crop well-adapted to black cotton and loamy soils.'
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    teluguName: 'మొక్కజొన్న',
    hindiName: 'मक्का',
    emoji: '🌽',
    category: 'Cereal / Fodder',
    season: 'Kharif / Rabi',
    targetNPK: { n: 150, p: 60, k: 40 },
    optimalRanges: {
      n: [110, 170],
      p: [45, 75],
      k: [25, 55],
      ph: [5.8, 7.5],
      temp: [18, 34],
      humidity: [45, 80],
      rainfall: [500, 850],
    },
    baseDosageAcre: { urea: 75, dap: 45, mop: 20 },
    micronutrients: 'Zinc Sulphate: 10 kg/acre basal application',
    growthPeriod: '90-110 days',
    waterRequirement: 'Moderate',
    description: 'Fast-growing high nutrient feeder with high yield potential and market versatility.'
  },
  {
    id: 'groundnut',
    name: 'Groundnut (Peanut)',
    teluguName: 'వేరుశనగ',
    hindiName: 'मूंगफली',
    emoji: '🥜',
    category: 'Oilseed / Legume',
    season: 'Kharif / Rabi',
    targetNPK: { n: 25, p: 50, k: 30 }, // Legume fixes nitrogen
    optimalRanges: {
      n: [15, 40],
      p: [35, 65],
      k: [20, 45],
      ph: [6.0, 7.5],
      temp: [22, 34],
      humidity: [40, 70],
      rainfall: [450, 750],
    },
    baseDosageAcre: { urea: 15, dap: 40, mop: 20 },
    micronutrients: 'Gypsum (CaSO₄): 200 kg/acre at 40-45 DAS for pod filling and peg strength',
    growthPeriod: '100-130 days',
    waterRequirement: 'Low',
    description: 'Legume oilseed that enriches soil nitrogen and thrives in light well-drained soils.'
  },
  {
    id: 'chillies',
    name: 'Chillies (Mirchi)',
    teluguName: 'మిరప',
    hindiName: 'मिर्च',
    emoji: '🌶️',
    category: 'Spices / Cash Crop',
    season: 'Kharif',
    targetNPK: { n: 130, p: 65, k: 65 },
    optimalRanges: {
      n: [95, 155],
      p: [45, 80],
      k: [45, 80],
      ph: [6.0, 7.2],
      temp: [20, 33],
      humidity: [50, 80],
      rainfall: [600, 1100],
    },
    baseDosageAcre: { urea: 65, dap: 45, mop: 35 },
    micronutrients: 'Micronutrient mix (Zinc, Boron, Calcium spray) at flowering',
    growthPeriod: '150-180 days',
    waterRequirement: 'Moderate',
    description: 'High-value commercial crop demanding balanced potash and phosphorus for fruit vigor.'
  },
  {
    id: 'bengal_gram',
    name: 'Bengal Gram (Chickpea / Chana)',
    teluguName: 'శనగలు',
    hindiName: 'चना',
    emoji: '🫘',
    category: 'Pulse / Legume',
    season: 'Rabi',
    targetNPK: { n: 25, p: 55, k: 25 },
    optimalRanges: {
      n: [15, 35],
      p: [40, 70],
      k: [15, 35],
      ph: [6.0, 7.8],
      temp: [14, 28],
      humidity: [30, 65],
      rainfall: [200, 450],
    },
    baseDosageAcre: { urea: 12, dap: 45, mop: 15 },
    micronutrients: 'Rhizobium biofertilizer seed treatment + PSB (Phosphate Solubilizing Bacteria)',
    growthPeriod: '90-110 days',
    waterRequirement: 'Low',
    description: 'Drought-tolerant cool-season pulse requiring low moisture and residual soil fertility.'
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    teluguName: 'చెరకు',
    hindiName: 'गन्ना',
    emoji: '🎋',
    category: 'Commercial / Cash Crop',
    season: 'Annual',
    targetNPK: { n: 250, p: 100, k: 125 },
    optimalRanges: {
      n: [180, 300],
      p: [70, 130],
      k: [90, 160],
      ph: [6.0, 8.0],
      temp: [24, 38],
      humidity: [60, 90],
      rainfall: [1100, 1800],
    },
    baseDosageAcre: { urea: 130, dap: 70, mop: 55 },
    micronutrients: 'Ferrous sulphate (FeSO₄): 10 kg/acre + Zinc sulphate: 15 kg/acre',
    growthPeriod: '300-365 days',
    waterRequirement: 'High',
    description: 'Heavy feeder demanding rich organic soils, ample sunlight, and staged nitrogen applications.'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    teluguName: 'టమోటా',
    hindiName: 'टमाटर',
    emoji: '🍅',
    category: 'Vegetable / Horticulture',
    season: 'Rabi / Kharif',
    targetNPK: { n: 110, p: 70, k: 70 },
    optimalRanges: {
      n: [80, 135],
      p: [45, 85],
      k: [45, 90],
      ph: [6.0, 7.0],
      temp: [18, 30],
      humidity: [50, 75],
      rainfall: [400, 800],
    },
    baseDosageAcre: { urea: 55, dap: 50, mop: 40 },
    micronutrients: 'Calcium Nitrate: 5 g/L foliar spray against blossom end rot',
    growthPeriod: '90-120 days',
    waterRequirement: 'Moderate',
    description: 'Responsive horticultural crop benefiting from high potassium for firm, vibrant fruits.'
  },
  {
    id: 'onion',
    name: 'Onion',
    teluguName: 'ఉల్లిపాయ',
    hindiName: 'प्याज',
    emoji: '🧅',
    category: 'Horticulture / Bulb',
    season: 'Rabi',
    targetNPK: { n: 100, p: 50, k: 50 },
    optimalRanges: {
      n: [70, 125],
      p: [35, 65],
      k: [35, 65],
      ph: [6.0, 7.2],
      temp: [15, 30],
      humidity: [40, 70],
      rainfall: [350, 600],
    },
    baseDosageAcre: { urea: 50, dap: 35, mop: 25 },
    micronutrients: 'Sulphur (Bentonite Sulphur 90%): 10 kg/acre for pungency and storage shelf life',
    growthPeriod: '120-150 days',
    waterRequirement: 'Moderate',
    description: 'Shallow-rooted bulb crop sensitive to water stagnation and responsive to sulphur.'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    teluguName: 'పొద్దుతిరుగుడు',
    hindiName: 'सूरजमुखी',
    emoji: '🌻',
    category: 'Oilseed',
    season: 'Rabi',
    targetNPK: { n: 60, p: 80, k: 30 },
    optimalRanges: {
      n: [40, 80],
      p: [55, 95],
      k: [20, 45],
      ph: [6.5, 8.0],
      temp: [20, 32],
      humidity: [40, 70],
      rainfall: [300, 600],
    },
    baseDosageAcre: { urea: 35, dap: 55, mop: 18 },
    micronutrients: 'Boron (Solubor 0.2%): foliar spray at ray floret opening for optimal seed setting',
    growthPeriod: '90-100 days',
    waterRequirement: 'Moderate',
    description: 'Photo-insensitive oilseed with high phosphorus requirement for seed filling.'
  },
  {
    id: 'turmeric',
    name: 'Turmeric (Haldi)',
    teluguName: 'పసుపు',
    hindiName: 'हल्दी',
    emoji: '🟡',
    category: 'Spices / Rhizome',
    season: 'Kharif',
    targetNPK: { n: 60, p: 30, k: 120 },
    optimalRanges: {
      n: [45, 80],
      p: [20, 45],
      k: [90, 150],
      ph: [5.5, 7.5],
      temp: [20, 35],
      humidity: [65, 90],
      rainfall: [900, 1500],
    },
    baseDosageAcre: { urea: 35, dap: 25, mop: 60 },
    micronutrients: 'Neem cake: 100 kg/acre + Trichoderma viride against rhizome rot',
    growthPeriod: '210-240 days',
    waterRequirement: 'Moderate',
    description: 'High potash feeder that thrives in warm humid climates and rich humus-rich loam.'
  },
  {
    id: 'red_gram',
    name: 'Red Gram (Pigeonpea / Tur Dal)',
    teluguName: 'కందులు',
    hindiName: 'अरहर / तुअर',
    emoji: '🫘',
    category: 'Pulse / Legume',
    season: 'Kharif',
    targetNPK: { n: 20, p: 50, k: 20 },
    optimalRanges: {
      n: [12, 35],
      p: [35, 65],
      k: [15, 30],
      ph: [6.0, 7.5],
      temp: [20, 35],
      humidity: [40, 75],
      rainfall: [500, 800],
    },
    baseDosageAcre: { urea: 12, dap: 35, mop: 15 },
    micronutrients: 'Sulphur 20 kg/ha for protein synthesis + Rhizobium seed inoculation',
    growthPeriod: '150-180 days',
    waterRequirement: 'Low',
    description: 'Deep taproot pulse capable of extracting moisture from subsoil; fixes nitrogen.'
  }
];

// Helper: Calculate normalized proximity score [0 - 100]
function calcParamScore(val, [min, max]) {
  if (val >= min && val <= max) return 100;
  const span = Math.max(max - min, 1);
  const dist = val < min ? (min - val) : (val - max);
  const penalty = (dist / span) * 100;
  return Math.max(0, Math.round(100 - penalty * 1.5));
}

// ── 1. CROP RECOMMENDATION AGENT ─────────────────────────────────
function runCropRecommendationAgent(soilInput) {
  const { n, p, k, ph, temperature, humidity, rainfall } = soilInput;

  const scoredCrops = CROP_PROFILES.map(crop => {
    const r = crop.optimalRanges;
    const nScore = calcParamScore(n, r.n);
    const pScore = calcParamScore(p, r.p);
    const kScore = calcParamScore(k, r.k);
    const phScore = calcParamScore(ph, r.ph);
    const tempScore = calcParamScore(temperature, r.temp);
    const humScore = calcParamScore(humidity, r.humidity);
    const rainScore = calcParamScore(rainfall, r.rainfall);

    // Weighted composite match
    const compositeScore = (
      rainScore * 0.22 +
      tempScore * 0.18 +
      phScore * 0.18 +
      nScore * 0.15 +
      pScore * 0.14 +
      kScore * 0.13
    );

    const matchConfidence = Math.min(98, Math.max(45, Math.round(compositeScore)));

    // Generate agronomic rationale
    const highlights = [];
    if (phScore >= 90) highlights.push(`Soil pH (${ph}) is in the optimal range (${r.ph[0]}-${r.ph[1]})`);
    if (tempScore >= 90) highlights.push(`Temperature (${temperature}°C) matches growth requirements (${r.temp[0]}-${r.temp[1]}°C)`);
    if (rainScore >= 85) highlights.push(`Rainfall/water (${rainfall}mm) fulfills crop hydrological demand`);
    if (nScore >= 85) highlights.push(`Available Nitrogen (${n} kg/ha) matches crop fertility baseline`);

    return {
      crop,
      confidence: matchConfidence,
      subScores: { nScore, pScore, kScore, phScore, tempScore, humScore, rainScore },
      highlights
    };
  });

  // Sort descending by confidence score
  scoredCrops.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = scoredCrops[0];
  const alternatives = scoredCrops.slice(1, 4).map(sc => ({
    name: sc.crop.name,
    emoji: sc.crop.emoji,
    category: sc.crop.category,
    confidence: sc.confidence,
    season: sc.crop.season,
  }));

  return {
    selectedCrop: bestMatch.crop,
    confidence: bestMatch.confidence,
    matchReason: bestMatch.highlights.length > 0
      ? bestMatch.highlights.join('. ') + '.'
      : `Best fit across temperature (${temperature}°C), rainfall (${rainfall}mm), and soil pH (${ph}).`,
    alternatives
  };
}

// ── 2. FERTILIZER RECOMMENDATION AGENT ────────────────────────────
/**
 * CRITICAL: The fertilizer recommendation directly depends on:
 * 1. The selected crop chosen by the Crop Agent
 * 2. The farmer's actual measured NPK and pH values
 */
function runFertilizerRecommendationAgent(selectedCrop, soilInput, language = 'en') {
  const { n, p, k, ph } = soilInput;
  const target = selectedCrop.targetNPK;
  const baseDosage = selectedCrop.baseDosageAcre;

  // Nutrient Deltas (Positive = Deficit/Need more; Negative = Excess/Surplus)
  const deltaN = target.n - n;
  const deltaP = target.p - p;
  const deltaK = target.k - k;

  // Categorize Status
  function evaluateNutrient(current, targetVal, delta) {
    const ratio = current / targetVal;
    let status, level, severity;
    if (ratio < 0.6) {
      status = 'Severe Deficit';
      level = 'Very Low';
      severity = 'high';
    } else if (ratio < 0.85) {
      status = 'Moderate Deficit';
      level = 'Low';
      severity = 'medium';
    } else if (ratio <= 1.25) {
      status = 'Optimal';
      level = 'Sufficient';
      severity = 'none';
    } else {
      status = 'Excess / High';
      level = 'High';
      severity = 'excess';
    }
    return {
      current,
      target: targetVal,
      delta: Math.round(delta),
      status,
      level,
      severity,
      percentOfTarget: Math.round(ratio * 100)
    };
  }

  const nAnalysis = evaluateNutrient(n, target.n, deltaN);
  const pAnalysis = evaluateNutrient(p, target.p, deltaP);
  const kAnalysis = evaluateNutrient(k, target.k, deltaK);

  // pH Evaluation
  let phStatus = 'Optimal';
  let phRemedy = null;
  if (ph < 5.8) {
    phStatus = 'Acidic';
    phRemedy = 'Apply Agricultural Lime (CaCO₃) or Dolomite @ 200-250 kg/acre before ploughing to raise pH and improve nutrient bioavailability.';
  } else if (ph > 7.8) {
    phStatus = 'Alkaline';
    phRemedy = 'Apply Agricultural Gypsum @ 150-200 kg/acre along with organic FYM/vermicompost (2 tons/acre) to reduce alkalinity.';
  }

  // Deficiencies and Excesses Lists
  const deficiencies = [];
  const excesses = [];

  if (deltaN > 15) deficiencies.push(`Nitrogen: Short by ${Math.round(deltaN)} kg/ha (Target: ${target.n} kg/ha)`);
  else if (deltaN < -25) excesses.push(`Nitrogen: Surplus by ${Math.round(Math.abs(deltaN))} kg/ha (Reduce Urea to avoid lodging & pests)`);

  if (deltaP > 10) deficiencies.push(`Phosphorus: Short by ${Math.round(deltaP)} kg/ha (Target: ${target.p} kg/ha)`);
  else if (deltaP < -20) excesses.push(`Phosphorus: Surplus by ${Math.round(Math.abs(deltaP))} kg/ha (Skip high-phosphate fertilizers)`);

  if (deltaK > 10) deficiencies.push(`Potassium: Short by ${Math.round(deltaK)} kg/ha (Target: ${target.k} kg/ha)`);
  else if (deltaK < -20) excesses.push(`Potassium: Surplus by ${Math.round(Math.abs(deltaK))} kg/ha (Reduce Muriate of Potash)`);

  // Dynamically compute adjusted dosage per acre based on soil delta
  // Base dosage is tuned for average soils; scale by delta ratio
  function adjustDose(baseKg, delta, targetVal) {
    if (delta <= -20) return Math.max(0, Math.round(baseKg * 0.5)); // surplus: reduce dose by 50%
    if (delta <= 0) return Math.round(baseKg * 0.85);
    const deficitRatio = Math.min(1.5, Math.max(0.9, 1 + (delta / targetVal) * 0.4));
    return Math.round(baseKg * deficitRatio);
  }

  const recUreaAcre = adjustDose(baseDosage.urea, deltaN, target.n);
  const recDapAcre = adjustDose(baseDosage.dap, deltaP, target.p);
  const recMopAcre = adjustDose(baseDosage.mop, deltaK, target.k);

  // Determine Primary Fertilizer Cocktail
  let fertilizerTypeName = '';
  const components = [];
  if (recUreaAcre > 0) components.push(`Urea (46% N)`);
  if (recDapAcre > 0) components.push(`DAP (18:46:0)`);
  if (recMopAcre > 0) components.push(`MOP (60% K₂O)`);
  if (components.length > 0) {
    fertilizerTypeName = components.join(' + ');
  } else {
    fertilizerTypeName = 'Organic Farmyard Manure (FYM) + Biofertilizers';
  }

  // Dosage summary string
  const dosageSummary = `Urea: ${recUreaAcre} kg/acre | DAP: ${recDapAcre} kg/acre | MOP: ${recMopAcre} kg/acre`;

  // Application Schedule (Staged Split Application)
  const schedule = [
    {
      stage: 'Basal Dressing (At Sowing / Transplanting)',
      timing: 'Day 0 (Pre-sowing / at planting)',
      items: [
        `100% DAP (${recDapAcre} kg/acre) placed 5cm below seed zone`,
        `100% MOP (${recMopAcre} kg/acre) for root establishment and cold/drought resistance`,
        recUreaAcre > 25 ? `25% Urea (${Math.round(recUreaAcre * 0.25)} kg/acre) as starter nitrogen` : null,
        selectedCrop.micronutrients ? selectedCrop.micronutrients : null,
      ].filter(Boolean),
      purpose: 'Stimulates vigorous root system and early vegetative seedling vigor.'
    },
    {
      stage: '1st Top Dressing (Active Vegetative / Tillering)',
      timing: selectedCrop.growthPeriod.includes('150') ? 'Day 25 - 30' : 'Day 20 - 25',
      items: [
        `50% Urea (${Math.round(recUreaAcre * 0.50)} kg/acre)`,
        'Irrigate field within 24-48 hours of application'
      ],
      purpose: 'Maximizes chlorophyll production, leaf canopy expansion, and tiller count.'
    },
    {
      stage: '2nd Top Dressing (Panicle Initiation / Flowering)',
      timing: selectedCrop.growthPeriod.includes('150') ? 'Day 50 - 60' : 'Day 40 - 45',
      items: [
        recUreaAcre > 25 ? `Remaining 25% Urea (${Math.round(recUreaAcre * 0.25)} kg/acre)` : 'Foliar micronutrient or 19-19-19 spray',
      ],
      purpose: 'Supports flower retention, pod/grain filling, and test weight.'
    }
  ];

  // Detailed Reason tying selected crop to farmer's soil values
  let reason = '';
  if (selectedCrop.category.includes('Legume') || selectedCrop.category.includes('Pulse')) {
    reason = `As ${selectedCrop.name} is a nitrogen-fixing legume, its nitrogen target is modest (${target.n} kg/ha). Your soil test shows N at ${n} kg/ha. DAP (${recDapAcre} kg/acre) provides the required root-building phosphorus (${target.p} kg/ha target vs ${p} kg/ha current), with minimal supplemental urea to preserve nodule formation.`;
  } else if (deltaN > 25) {
    reason = `For ${selectedCrop.name}, optimal yield requires high nitrogen (${target.n} kg/ha), but your measured soil nitrogen is low (${n} kg/ha, a deficit of ${Math.round(deltaN)} kg/ha). To correct this deficit without nitrogen leaching, apply ${recDapAcre} kg/acre DAP at sowing for phosphorus, and split ${recUreaAcre} kg/acre Urea into two top dressings.`;
  } else if (deltaN < -20) {
    reason = `Your soil contains high reserve Nitrogen (${n} kg/ha vs ${target.n} kg/ha required by ${selectedCrop.name}). Recommended Urea has been reduced to ${recUreaAcre} kg/acre to prevent excessive vegetative lodging, pest vulnerability, and delayed maturity.`;
  } else {
    reason = `For ${selectedCrop.name}, current soil NPK (${n}:${p}:${k}) moderately satisfies the crop's target (${target.n}:${target.p}:${target.k} kg/ha). Applying ${recDapAcre} kg DAP and ${recMopAcre} kg MOP at sowing ensures balanced root establishment, while ${recUreaAcre} kg Urea maintains canopy vigor through reproductive stages.`;
  }

  if (phRemedy) {
    reason += ` Note: ${phRemedy}`;
  }

  return {
    cropName: selectedCrop.name,
    cropCategory: selectedCrop.category,
    currentNPK: { n, p, k, ph },
    requiredNPK: target,
    nutrientStatus: {
      n: nAnalysis,
      p: pAnalysis,
      k: kAnalysis,
      ph: { value: ph, status: phStatus, remedy: phRemedy }
    },
    deficiencies,
    excesses,
    fertilizerType: fertilizerTypeName,
    dosage: dosageSummary,
    dosagePerAcre: {
      urea: `${recUreaAcre} kg/acre`,
      dap: `${recDapAcre} kg/acre`,
      mop: `${recMopAcre} kg/acre`,
      micronutrient: selectedCrop.micronutrients
    },
    dosagePerHectare: {
      urea: `${Math.round(recUreaAcre * 2.47)} kg/ha`,
      dap: `${Math.round(recDapAcre * 2.47)} kg/ha`,
      mop: `${Math.round(recMopAcre * 2.47)} kg/ha`,
    },
    schedule,
    reason
  };
}

// ── 3. CENTRAL AI COORDINATOR ────────────────────────────────────
/**
 * Shares findings between Crop Agent and Fertilizer Agent through
 * a central coordinator to produce one cohesive collective intelligence result.
 */
async function coordinateCropAndFertilizer(soilInput, language = 'en', llmHelper = null) {
  // Validate and parse numerical inputs
  const parsed = {
    n: Number(soilInput.n) || 0,
    p: Number(soilInput.p) || 0,
    k: Number(soilInput.k) || 0,
    ph: Number(soilInput.ph) || 6.5,
    temperature: Number(soilInput.temperature) || 28,
    humidity: Number(soilInput.humidity) || 65,
    rainfall: Number(soilInput.rainfall) || 750,
  };

  // Step 1: Crop Agent analyzes soil & climate -> determines Best Crop
  const cropAgentResult = runCropRecommendationAgent(parsed);
  const selectedCrop = cropAgentResult.selectedCrop;

  // Step 2: Fertilizer Agent takes selected crop AND original soil NPK data
  const fertilizerAgentResult = runFertilizerRecommendationAgent(selectedCrop, parsed, language);

  // Step 3: Central Coordinator computes Soil Health Index & Pipeline Synthesis
  const soilHealthScore = Math.min(100, Math.max(30, Math.round(
    (fertilizerAgentResult.nutrientStatus.n.percentOfTarget <= 100 ? fertilizerAgentResult.nutrientStatus.n.percentOfTarget : 200 - fertilizerAgentResult.nutrientStatus.n.percentOfTarget) * 0.35 +
    (fertilizerAgentResult.nutrientStatus.p.percentOfTarget <= 100 ? fertilizerAgentResult.nutrientStatus.p.percentOfTarget : 200 - fertilizerAgentResult.nutrientStatus.p.percentOfTarget) * 0.30 +
    (fertilizerAgentResult.nutrientStatus.k.percentOfTarget <= 100 ? fertilizerAgentResult.nutrientStatus.k.percentOfTarget : 200 - fertilizerAgentResult.nutrientStatus.k.percentOfTarget) * 0.25 +
    (parsed.ph >= 6.0 && parsed.ph <= 7.5 ? 100 : 70) * 0.10
  )));

  // Connected Flow Description
  const pipelineFlow = [
    { step: 1, name: 'Soil & Climate Intake', status: 'Completed', detail: `N:${parsed.n}, P:${parsed.p}, K:${parsed.k}, pH:${parsed.ph}, Temp:${parsed.temperature}°C, Rain:${parsed.rainfall}mm` },
    { step: 2, name: 'AI Crop Recommendation Agent', status: 'Completed', detail: `Analyzed climate and soil suitability across 12 crop profiles` },
    { step: 3, name: 'Best Crop Selection', status: 'Completed', detail: `${selectedCrop.emoji} ${selectedCrop.name} (${cropAgentResult.confidence}% confidence)` },
    { step: 4, name: 'Nutrient Gap Analysis', status: 'Completed', detail: `Mapped measured soil against ${selectedCrop.name} nutrient requirements (${selectedCrop.targetNPK.n}:${selectedCrop.targetNPK.p}:${selectedCrop.targetNPK.k})` },
    { step: 5, name: 'AI Fertilizer Recommendation Agent', status: 'Completed', detail: `Formulated ${fertilizerAgentResult.fertilizerType} dosage and stage schedule` }
  ];

  // Optional LLM enrichment if available and requested
  let coordinatorInsight = fertilizerAgentResult.reason;
  if (llmHelper && typeof llmHelper === 'function') {
    try {
      const prompt = `You are the AgroSmart Chief Agronomist AI Coordinator.
Synthesize this recommendation into 2 concise, practical sentences for an Indian farmer:
- Selected Crop: ${selectedCrop.name} (${cropAgentResult.confidence}% confidence)
- Current Soil NPK: ${parsed.n}:${parsed.p}:${parsed.k}, pH: ${parsed.ph}
- Target NPK for ${selectedCrop.name}: ${selectedCrop.targetNPK.n}:${selectedCrop.targetNPK.p}:${selectedCrop.targetNPK.k}
- Deficiencies: ${fertilizerAgentResult.deficiencies.join(', ') || 'None'}
- Recommended Fertilizer: ${fertilizerAgentResult.fertilizerType} (${fertilizerAgentResult.dosage})
Language: ${language}. Keep it clear, empowering, and actionable.`;

      const aiText = await llmHelper(prompt);
      if (aiText && aiText.trim()) coordinatorInsight = aiText.trim();
    } catch (e) {
      // Graceful fallback to deterministic insight
    }
  }

  return {
    success: true,
    soilClimateInput: parsed,
    coordinatorSynthesis: {
      soilHealthScore,
      summary: `AI Collective Intelligence successfully unified Crop and Fertilizer plans for ${selectedCrop.name}.`,
      insight: coordinatorInsight,
      pipelineFlow
    },
    cropAnalysis: {
      recommendedCrop: selectedCrop.name,
      teluguName: selectedCrop.teluguName,
      hindiName: selectedCrop.hindiName,
      emoji: selectedCrop.emoji,
      category: selectedCrop.category,
      season: selectedCrop.season,
      growthPeriod: selectedCrop.growthPeriod,
      waterRequirement: selectedCrop.waterRequirement,
      confidence: cropAgentResult.confidence,
      matchReason: cropAgentResult.matchReason,
      alternatives: cropAgentResult.alternatives,
    },
    nutrientAnalysis: {
      current: {
        n: parsed.n,
        p: parsed.p,
        k: parsed.k,
        ph: parsed.ph
      },
      required: {
        n: selectedCrop.targetNPK.n,
        p: selectedCrop.targetNPK.p,
        k: selectedCrop.targetNPK.k,
        phRange: `${selectedCrop.optimalRanges.ph[0]} - ${selectedCrop.optimalRanges.ph[1]}`
      },
      status: fertilizerAgentResult.nutrientStatus,
      deficiencies: fertilizerAgentResult.deficiencies,
      excesses: fertilizerAgentResult.excesses
    },
    fertilizerRecommendation: {
      fertilizerType: fertilizerAgentResult.fertilizerType,
      dosage: fertilizerAgentResult.dosage,
      dosagePerAcre: fertilizerAgentResult.dosagePerAcre,
      dosagePerHectare: fertilizerAgentResult.dosagePerHectare,
      schedule: fertilizerAgentResult.schedule,
      reason: fertilizerAgentResult.reason,
      micronutrients: selectedCrop.micronutrients
    }
  };
}

module.exports = {
  CROP_PROFILES,
  runCropRecommendationAgent,
  runFertilizerRecommendationAgent,
  coordinateCropAndFertilizer
};
