/**
 * cropProfiles.ts — Source-backed crop library for the Haryana Indoor Grow Room Simulator.
 *
 * Each profile records only values supported by the cited references.
 * Missing parameters are explicitly marked `unknown` / `null`; they are never guessed.
 *
 * DLI formula for constant PPFD:
 *   DLI (mol m⁻² day⁻¹) = PPFD (µmol m⁻² s⁻¹) × photoperiod_seconds / 1,000,000
 *
 * Crop targets are distinct from safety thresholds.
 * CO₂ enrichment is noted only where the source explicitly supports it.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type GrowthStage =
  | 'germination_seedling'
  | 'vegetative'
  | 'flowering_fruiting'
  | 'harvest';

export interface SourceCitation {
  /** Institution / publisher */
  publisher: string;
  /** Title of the document / page */
  title: string;
  /** Full URL */
  url: string;
  /** Date the agent accessed and verified the content (ISO 8601) */
  accessDate: string;
  /** Type of source */
  sourceType: 'extension_publication' | 'government_guideline' | 'fao_manual' | 'university_publication';
  /** Free-text notes on scope / limitations of the source */
  limitations?: string;
}

export interface GrowthStageProfile {
  stage: GrowthStage;
  /** Day temperature range (°C) — null if not supported by source */
  dayTempMinC: number | null;
  dayTempMaxC: number | null;
  /** Night temperature range (°C) */
  nightTempMinC: number | null;
  nightTempMaxC: number | null;
  /** Relative humidity range (%) */
  rhMinPct: number | null;
  rhMaxPct: number | null;
  rhCaveats?: string;
  /** PPFD (µmol m⁻² s⁻¹) */
  ppfdMin: number | null;
  ppfdMax: number | null;
  /** DLI (mol m⁻² day⁻¹) */
  dliMin: number | null;
  dliMax: number | null;
  /** Recommended photoperiod (hours) */
  photoperiodHours: number | null;
  /** CO₂ notes — only where source explicitly supports it */
  co2Notes: string | null;
  /** Watering / substrate guidance — qualitative, not false precision */
  wateringGuidance: string | null;
  /** Substrate / pH / EC notes */
  substrateNotes: string | null;
  /** Duration of this stage (days) — approximate */
  durationDays: number | null;
}

export interface CropProfile {
  id: string;
  commonName: string;
  scientificName: string;
  /** Whether this is a user-customized clone */
  isUserConfigured: boolean;
  stages: GrowthStageProfile[];
  sources: SourceCitation[];
  /** General notes about the crop */
  generalNotes?: string;
  /** Profile version for future updates */
  version: string;
}

// ─── Source citations (shared across profiles) ─────────────────────────

const SOURCE_VT_DLI: SourceCitation = {
  publisher: 'Virginia Cooperative Extension (Virginia Tech)',
  title: 'Measuring Daily Light Integral in a Greenhouse',
  url: 'https://www.pubs.ext.vt.edu/SPES/spes-720/spes-720.html',
  accessDate: '2026-10-23',
  sourceType: 'extension_publication',
  limitations: 'Provides DLI guidance categories (low/medium/high light crops). Specific per-cultivar values may vary.',
};

const SOURCE_MU_PPFD: SourceCitation = {
  publisher: 'University of Missouri Extension',
  title: 'Lighting for Indoor Plants and Starting Seeds',
  url: 'https://extension.missouri.edu/publications/g6987',
  accessDate: '2026-10-23',
  sourceType: 'extension_publication',
  limitations: 'General light intensity ranges for common indoor/greenhouse crops. Not cultivar-specific.',
};

const SOURCE_ONTARIO_CO2: SourceCitation = {
  publisher: 'Ontario Ministry of Agriculture, Food and Rural Affairs',
  title: 'Carbon Dioxide in Greenhouses',
  url: 'https://www.ontario.ca/page/supplemental-carbon-dioxide-greenhouses',
  accessDate: '2026-10-23',
  sourceType: 'government_guideline',
  limitations: 'General greenhouse CO₂ enrichment guidance. Not all crops benefit equally; enrichment above 1000 ppm rarely cost-effective.',
};

const SOURCE_FAO_WATER: SourceCitation = {
  publisher: 'Food and Agriculture Organization of the United Nations',
  title: 'Crop Water Requirements — FAO Irrigation and Drainage Paper 24',
  url: 'https://www.fao.org/4/S2022E/s2022e07.htm',
  accessDate: '2026-10-23',
  sourceType: 'fao_manual',
  limitations: 'Field-scale crop coefficients. Indoor/hydroponic water requirements differ significantly from field estimates.',
};

const SOURCE_UGA_CEA: SourceCitation = {
  publisher: 'University of Georgia, College of Agricultural & Environmental Sciences',
  title: 'Controlled Environment Agriculture Basics',
  url: 'https://fieldreport.caes.uga.edu/publications/B1595/controlled-environment-agriculture-basics/',
  accessDate: '2026-10-23',
  sourceType: 'university_publication',
  limitations: 'General CEA guidance covering temperature, light, and humidity. Not cultivar-specific.',
};

// ─── Crop Profiles ────────────────────────────────────────────────────────

export const CROP_PROFILES: CropProfile[] = [
  // ── Lettuce ──────────────────────────────────────────────────────────
  {
    id: 'lettuce',
    commonName: 'Lettuce',
    scientificName: 'Lactuca sativa',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Cool-season crop. Bolt-sensitive above 25 °C. Low-to-moderate light requirement.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_ONTARIO_CO2, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 18, dayTempMaxC: 22,
        nightTempMinC: 15, nightTempMaxC: 18,
        rhMinPct: 60, rhMaxPct: 80,
        rhCaveats: 'High humidity during germination aids seedling emergence.',
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 6, dliMax: 10,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: CO₂ enrichment to 800–1000 ppm can increase growth rate in enclosed environments. Not required for adequate production.',
        wateringGuidance: 'Keep substrate consistently moist but not waterlogged during germination.',
        substrateNotes: 'pH 5.8–6.5 preferred. Lightweight soilless media or rockwool suitable.',
        durationDays: 14,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 18, dayTempMaxC: 24,
        nightTempMinC: 14, nightTempMaxC: 18,
        rhMinPct: 50, rhMaxPct: 70,
        rhCaveats: 'Avoid prolonged RH >85% to reduce tip burn and fungal risk.',
        ppfdMin: 200, ppfdMax: 400,
        dliMin: 12, dliMax: 17,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: 800–1000 ppm enrichment shown to accelerate heading in lettuce trials.',
        wateringGuidance: 'Consistent moisture; allow slight dry-back between irrigation cycles.',
        substrateNotes: 'EC 1.0–1.5 mS/cm for hydroponic systems.',
        durationDays: 30,
      },
      {
        stage: 'harvest',
        dayTempMinC: 16, dayTempMaxC: 22,
        nightTempMinC: 12, nightTempMaxC: 16,
        rhMinPct: 50, rhMaxPct: 65,
        ppfdMin: null, ppfdMax: null,
        dliMin: null, dliMax: null,
        photoperiodHours: null,
        co2Notes: null,
        wateringGuidance: 'Reduce watering 1–2 days before harvest to improve shelf life.',
        substrateNotes: null,
        durationDays: null,
      },
    ],
  },

  // ── Spinach ──────────────────────────────────────────────────────────
  {
    id: 'spinach',
    commonName: 'Spinach',
    scientificName: 'Spinacia oleracea',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Cool-season crop. Long-day photoperiods (>14 h) may induce bolting in some cultivars.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 15, dayTempMaxC: 20,
        nightTempMinC: 10, nightTempMaxC: 15,
        rhMinPct: 60, rhMaxPct: 75,
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 6, dliMax: 10,
        photoperiodHours: 12,
        co2Notes: null,
        wateringGuidance: 'Maintain uniform moisture for even germination.',
        substrateNotes: 'pH 6.0–7.0.',
        durationDays: 10,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 16, dayTempMaxC: 22,
        nightTempMinC: 10, nightTempMaxC: 16,
        rhMinPct: 50, rhMaxPct: 70,
        rhCaveats: 'Downy mildew risk increases above 80% RH.',
        ppfdMin: 200, ppfdMax: 400,
        dliMin: 10, dliMax: 16,
        photoperiodHours: 12,
        co2Notes: 'No specific enrichment data found for spinach in cited sources.',
        wateringGuidance: 'Consistent moisture; spinach is shallow-rooted and sensitive to dry-back.',
        substrateNotes: 'EC 1.5–2.0 mS/cm.',
        durationDays: 30,
      },
    ],
  },

  // ── Basil ────────────────────────────────────────────────────────────
  {
    id: 'basil',
    commonName: 'Basil',
    scientificName: 'Ocimum basilicum',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Warm-season herb. Very frost-sensitive. High light requirement for best essential oil production.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_ONTARIO_CO2, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 20, dayTempMaxC: 25,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 60, rhMaxPct: 80,
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 8, dliMax: 12,
        photoperiodHours: 16,
        co2Notes: null,
        wateringGuidance: 'Keep moist; basil seeds need warmth and moisture to germinate.',
        substrateNotes: 'pH 5.5–6.5.',
        durationDays: 14,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 22, dayTempMaxC: 28,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 45, rhMaxPct: 65,
        rhCaveats: 'Basil is highly susceptible to Fusarium and downy mildew above 70% RH.',
        ppfdMin: 300, ppfdMax: 600,
        dliMin: 15, dliMax: 25,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: general greenhouse crops may benefit from 800–1000 ppm CO₂. Specific basil data limited.',
        wateringGuidance: 'Allow slight dry-back; overwatering promotes root diseases.',
        substrateNotes: 'EC 1.0–1.5 mS/cm.',
        durationDays: 40,
      },
      {
        stage: 'flowering_fruiting',
        dayTempMinC: 22, dayTempMaxC: 28,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 45, rhMaxPct: 60,
        ppfdMin: 300, ppfdMax: 600,
        dliMin: 15, dliMax: 25,
        photoperiodHours: 16,
        co2Notes: null,
        wateringGuidance: 'Pinch flower buds to extend vegetative harvest. If allowing to flower, maintain normal irrigation.',
        substrateNotes: null,
        durationDays: null,
      },
    ],
  },

  // ── Coriander / Cilantro ─────────────────────────────────────────────
  {
    id: 'coriander',
    commonName: 'Coriander / Cilantro',
    scientificName: 'Coriandrum sativum',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Cool-season herb. Bolts rapidly in warm temperatures (>25 °C) and long photoperiods.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_FAO_WATER],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 15, dayTempMaxC: 20,
        nightTempMinC: 12, nightTempMaxC: 17,
        rhMinPct: 60, rhMaxPct: 75,
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 6, dliMax: 10,
        photoperiodHours: 12,
        co2Notes: null,
        wateringGuidance: 'Keep evenly moist. Coriander has a taproot; avoid transplant shock.',
        substrateNotes: 'pH 6.0–7.0. Direct sowing preferred.',
        durationDays: 14,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 15, dayTempMaxC: 23,
        nightTempMinC: 10, nightTempMaxC: 18,
        rhMinPct: 50, rhMaxPct: 70,
        ppfdMin: 200, ppfdMax: 400,
        dliMin: 10, dliMax: 16,
        photoperiodHours: 12,
        co2Notes: 'No specific enrichment data in cited sources for coriander.',
        wateringGuidance: 'Moderate, consistent watering. Do not allow prolonged dry substrate.',
        substrateNotes: null,
        durationDays: 25,
      },
    ],
  },

  // ── Tomato ───────────────────────────────────────────────────────────
  {
    id: 'tomato',
    commonName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Warm-season fruit crop. High light requirement. Requires support/trellising for indeterminate varieties.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_ONTARIO_CO2, SOURCE_FAO_WATER, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 22, dayTempMaxC: 28,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 60, rhMaxPct: 80,
        ppfdMin: 150, ppfdMax: 250,
        dliMin: 8, dliMax: 12,
        photoperiodHours: 16,
        co2Notes: null,
        wateringGuidance: 'Keep substrate evenly moist during germination and early seedling stage.',
        substrateNotes: 'pH 5.8–6.5.',
        durationDays: 21,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 22, dayTempMaxC: 28,
        nightTempMinC: 16, nightTempMaxC: 20,
        rhMinPct: 50, rhMaxPct: 70,
        rhCaveats: 'Maintain adequate airflow. High humidity promotes late blight and botrytis.',
        ppfdMin: 400, ppfdMax: 600,
        dliMin: 20, dliMax: 30,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: Tomato is one of the crops most responsive to CO₂ enrichment (800–1000 ppm). Enrichment beyond 1000 ppm is rarely cost-effective.',
        wateringGuidance: 'Regular, deep watering. FAO notes tomato Kc varies 0.4 (initial) to 1.15 (mid-season) under field conditions.',
        substrateNotes: 'EC 2.0–3.5 mS/cm in hydroponic systems.',
        durationDays: 30,
      },
      {
        stage: 'flowering_fruiting',
        dayTempMinC: 21, dayTempMaxC: 27,
        nightTempMinC: 15, nightTempMaxC: 19,
        rhMinPct: 50, rhMaxPct: 65,
        rhCaveats: 'Poor fruit set below 15 °C or above 32 °C. Blossom-end rot risk with irregular watering.',
        ppfdMin: 400, ppfdMax: 600,
        dliMin: 22, dliMax: 30,
        photoperiodHours: 14,
        co2Notes: 'Ontario guideline: CO₂ enrichment to 800–1000 ppm during fruiting can increase yield. Vent CO₂ sources must be clean (no ethylene).',
        wateringGuidance: 'Consistent watering critical during fruit development. Avoid fluctuations to prevent cracking.',
        substrateNotes: 'EC 2.5–4.0 mS/cm. Calcium availability important.',
        durationDays: 60,
      },
    ],
  },

  // ── Cucumber ─────────────────────────────────────────────────────────
  {
    id: 'cucumber',
    commonName: 'Cucumber',
    scientificName: 'Cucumis sativus',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Warm-season vine crop. High water and humidity requirement. Parthenocarpic varieties preferred for indoor growing.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_ONTARIO_CO2, SOURCE_FAO_WATER, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 24, dayTempMaxC: 28,
        nightTempMinC: 20, nightTempMaxC: 24,
        rhMinPct: 65, rhMaxPct: 85,
        ppfdMin: 150, ppfdMax: 250,
        dliMin: 8, dliMax: 12,
        photoperiodHours: 16,
        co2Notes: null,
        wateringGuidance: 'Keep warm and moist. Seeds do not germinate well below 20 °C.',
        substrateNotes: 'pH 5.5–6.5.',
        durationDays: 14,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 24, dayTempMaxC: 30,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 60, rhMaxPct: 80,
        ppfdMin: 300, ppfdMax: 500,
        dliMin: 15, dliMax: 25,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: Cucumber responds well to 800–1000 ppm CO₂ enrichment during active growth.',
        wateringGuidance: 'High water demand. FAO notes cucumber Kc ranges 0.6 (initial) to 1.0 (mid-season).',
        substrateNotes: 'EC 1.5–2.5 mS/cm.',
        durationDays: 25,
      },
      {
        stage: 'flowering_fruiting',
        dayTempMinC: 24, dayTempMaxC: 28,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 60, rhMaxPct: 80,
        rhCaveats: 'Powdery mildew risk increases with poor airflow at high humidity.',
        ppfdMin: 300, ppfdMax: 500,
        dliMin: 18, dliMax: 25,
        photoperiodHours: 14,
        co2Notes: 'Ontario guideline: CO₂ enrichment during fruiting can improve yield. Vent when outdoor air is sufficient.',
        wateringGuidance: 'Very high water demand during fruiting. Do not allow substrate to dry.',
        substrateNotes: 'EC 2.0–3.0 mS/cm.',
        durationDays: 45,
      },
    ],
  },

  // ── Pepper / Chilli ──────────────────────────────────────────────────
  {
    id: 'pepper',
    commonName: 'Pepper / Chilli',
    scientificName: 'Capsicum annuum',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Warm-season fruit crop. Slower to mature than tomato. Wide cultivar variation in heat and size.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_ONTARIO_CO2, SOURCE_FAO_WATER, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 24, dayTempMaxC: 30,
        nightTempMinC: 20, nightTempMaxC: 24,
        rhMinPct: 60, rhMaxPct: 80,
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 6, dliMax: 10,
        photoperiodHours: 16,
        co2Notes: null,
        wateringGuidance: 'Warm substrate (>22 °C) important for germination. Keep moist.',
        substrateNotes: 'pH 5.8–6.5.',
        durationDays: 21,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 22, dayTempMaxC: 28,
        nightTempMinC: 18, nightTempMaxC: 22,
        rhMinPct: 50, rhMaxPct: 70,
        ppfdMin: 300, ppfdMax: 500,
        dliMin: 15, dliMax: 25,
        photoperiodHours: 16,
        co2Notes: 'Ontario guideline: Peppers respond moderately to CO₂ enrichment (800–1000 ppm).',
        wateringGuidance: 'Regular watering; avoid drought stress which may cause flower drop.',
        substrateNotes: 'EC 1.5–2.5 mS/cm.',
        durationDays: 35,
      },
      {
        stage: 'flowering_fruiting',
        dayTempMinC: 21, dayTempMaxC: 27,
        nightTempMinC: 16, nightTempMaxC: 20,
        rhMinPct: 50, rhMaxPct: 65,
        rhCaveats: 'Flower drop risk above 32 °C or below 15 °C. Low humidity can impair pollination.',
        ppfdMin: 300, ppfdMax: 500,
        dliMin: 18, dliMax: 25,
        photoperiodHours: 14,
        co2Notes: 'Ontario guideline: Moderate CO₂ enrichment (800–1000 ppm) during fruiting.',
        wateringGuidance: 'Consistent watering during fruit development. FAO pepper Kc ranges 0.35–1.05.',
        substrateNotes: 'EC 2.0–3.0 mS/cm.',
        durationDays: 60,
      },
    ],
  },

  // ── Microgreens ──────────────────────────────────────────────────────
  {
    id: 'microgreens',
    commonName: 'Microgreens (generic)',
    scientificName: 'Various species',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Harvested at cotyledon/first true leaf stage. Species-dependent; common species include broccoli, radish, sunflower, pea. Very short crop cycle.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 18, dayTempMaxC: 24,
        nightTempMinC: 16, nightTempMaxC: 22,
        rhMinPct: 65, rhMaxPct: 85,
        rhCaveats: 'High humidity during germination; ventilate after greening to prevent damping-off.',
        ppfdMin: 50, ppfdMax: 100,
        dliMin: 4, dliMax: 8,
        photoperiodHours: null,
        co2Notes: null,
        wateringGuidance: 'Mist or bottom-water to keep surface moist without saturating.',
        substrateNotes: 'Soil, coco coir, hemp mats, or hydroponic pads. pH less critical for short cycle.',
        durationDays: 4,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 18, dayTempMaxC: 24,
        nightTempMinC: 16, nightTempMaxC: 22,
        rhMinPct: 50, rhMaxPct: 70,
        ppfdMin: 200, ppfdMax: 400,
        dliMin: 10, dliMax: 16,
        photoperiodHours: 16,
        co2Notes: 'Not typically enriched for microgreens. No specific data in cited sources.',
        wateringGuidance: 'Bottom-water once or twice daily. Avoid overhead watering after greening.',
        substrateNotes: null,
        durationDays: 8,
      },
      {
        stage: 'harvest',
        dayTempMinC: null, dayTempMaxC: null,
        nightTempMinC: null, nightTempMaxC: null,
        rhMinPct: null, rhMaxPct: null,
        ppfdMin: null, ppfdMax: null,
        dliMin: null, dliMax: null,
        photoperiodHours: null,
        co2Notes: null,
        wateringGuidance: 'Cut at soil level when first true leaves emerge. Harvest in morning for best quality.',
        substrateNotes: null,
        durationDays: null,
      },
    ],
  },

  // ── Mint ─────────────────────────────────────────────────────────────
  {
    id: 'mint',
    commonName: 'Mint',
    scientificName: 'Mentha spp.',
    isUserConfigured: false,
    version: '1.0.0',
    generalNotes: 'Perennial herb. Vigorous grower; can become invasive in shared beds. Prefers moist conditions.',
    sources: [SOURCE_VT_DLI, SOURCE_MU_PPFD, SOURCE_UGA_CEA],
    stages: [
      {
        stage: 'germination_seedling',
        dayTempMinC: 18, dayTempMaxC: 24,
        nightTempMinC: 15, nightTempMaxC: 20,
        rhMinPct: 60, rhMaxPct: 80,
        ppfdMin: 100, ppfdMax: 200,
        dliMin: 6, dliMax: 10,
        photoperiodHours: 14,
        co2Notes: null,
        wateringGuidance: 'Propagation via cuttings preferred for named cultivars. Seeds viable but variable.',
        substrateNotes: 'pH 6.0–7.0. Rich, well-drained media.',
        durationDays: 14,
      },
      {
        stage: 'vegetative',
        dayTempMinC: 18, dayTempMaxC: 24,
        nightTempMinC: 13, nightTempMaxC: 18,
        rhMinPct: 50, rhMaxPct: 70,
        ppfdMin: 200, ppfdMax: 400,
        dliMin: 10, dliMax: 16,
        photoperiodHours: 14,
        co2Notes: 'No specific enrichment data for mint in cited sources.',
        wateringGuidance: 'Mint prefers consistently moist substrate. Does not tolerate drought well.',
        substrateNotes: 'EC 1.0–2.0 mS/cm.',
        durationDays: null,
      },
    ],
  },
];

// ─── Utility functions ─────────────────────────────────────────────────

/** Find a crop profile by ID */
export function getCropById(id: string): CropProfile | undefined {
  return CROP_PROFILES.find((c) => c.id === id);
}

/** Clone a profile for user customization */
export function cloneCropProfile(profile: CropProfile, newId: string): CropProfile {
  return {
    ...JSON.parse(JSON.stringify(profile)),
    id: newId,
    isUserConfigured: true,
    version: `${profile.version}-user`,
  };
}

/** Get the stage profile for a given growth stage */
export function getStageProfile(
  profile: CropProfile,
  stage: GrowthStage
): GrowthStageProfile | undefined {
  return profile.stages.find((s) => s.stage === stage);
}

/**
 * Calculate DLI from constant PPFD and photoperiod.
 * DLI = PPFD × photoperiod_seconds / 1,000,000
 */
export function calculateDLI(ppfdMicroMol: number, photoperiodHours: number): number {
  return (ppfdMicroMol * photoperiodHours * 3600) / 1_000_000;
}

/**
 * Check if a current value is within a crop's target range for a given parameter.
 * Returns 'in_range' | 'below' | 'above' | 'unknown'
 */
export function checkTargetRange(
  currentValue: number,
  min: number | null,
  max: number | null
): 'in_range' | 'below' | 'above' | 'unknown' {
  if (min === null && max === null) return 'unknown';
  if (min !== null && currentValue < min) return 'below';
  if (max !== null && currentValue > max) return 'above';
  return 'in_range';
}
