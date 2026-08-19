import modelKategoriRaw from './model_kategori.json';
import modelPrioritasRaw from './model_prioritas.json';
import { KategoriAduan } from './supabase';

export interface MLModelData {
  vocabulary: Record<string, number>;
  idf: number[];
  classes: string[];
  coef: number[][];
  intercept: number[];
}

const modelKategori: MLModelData = modelKategoriRaw as unknown as MLModelData;
const modelPrioritas: MLModelData = modelPrioritasRaw as unknown as MLModelData;

export interface ClassificationResult {
  kategori: KategoriAduan;
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  score: number;
  confidenceKategori?: number;
  confidencePrioritas?: number;
  probabilitiesKategori?: { label: string; prob: number }[];
  probabilitiesPrioritas?: { label: string; prob: number }[];
}

/**
 * Predict class using TF-IDF + Softmax Linear Classifier
 */
function predictML(
  model: MLModelData,
  text: string
): { label: string; confidence: number; probs: { label: string; prob: number }[] } {
  const words = text.toLowerCase().match(/[a-zA-Z0-9_]+/g) || [];
  if (words.length === 0 || !model.classes || model.classes.length === 0) {
    return {
      label: model.classes?.[0] || 'Masalah Lainnya',
      confidence: 0,
      probs: (model.classes || []).map((c) => ({ label: c, prob: 1 / (model.classes.length || 1) })),
    };
  }

  // Extract 1-gram, 2-gram, and 3-grams
  const termCounts: Record<number, number> = {};
  for (let n = 1; n <= 3; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const ng = words.slice(i, i + n).join(' ');
      const idx = model.vocabulary[ng];
      if (idx !== undefined) {
        termCounts[idx] = (termCounts[idx] || 0) + 1;
      }
    }
  }

  const numFeatures = model.idf.length;
  const tfidf = new Float64Array(numFeatures);
  let sumSq = 0;

  for (const [idxStr, count] of Object.entries(termCounts)) {
    const idx = parseInt(idxStr, 10);
    const val = count * model.idf[idx];
    tfidf[idx] = val;
    sumSq += val * val;
  }

  // L2 Normalization
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < numFeatures; i++) {
      if (tfidf[i] !== 0) tfidf[i] /= norm;
    }
  }

  // Compute class logit scores
  const scores: number[] = [];
  for (let c = 0; c < model.classes.length; c++) {
    let s = model.intercept[c];
    for (const [idxStr] of Object.entries(termCounts)) {
      const idx = parseInt(idxStr, 10);
      s += tfidf[idx] * model.coef[c][idx];
    }
    scores.push(s);
  }

  // Softmax
  const maxScore = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - maxScore));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sumExps);

  let bestIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[bestIdx]) bestIdx = i;
  }

  return {
    label: model.classes[bestIdx],
    confidence: Math.round(probs[bestIdx] * 100),
    probs: model.classes.map((cls, i) => ({ label: cls, prob: Math.round(probs[i] * 100) })),
  };
}

/**
 * Main classification function integrated with dynamic ML categories
 */
export function classifyReport(description: string): ClassificationResult {
  const defaultKategori = modelKategori.classes[0] || 'Jalan & Jembatan';

  if (!description || description.trim().length < 3) {
    return {
      kategori: defaultKategori,
      prioritas: 'Sedang',
      score: 50,
      confidenceKategori: 0,
      confidencePrioritas: 0,
    };
  }

  try {
    const resKat = predictML(modelKategori, description);
    const resPri = predictML(modelPrioritas, description);

    const validPrioritas = ['Tinggi', 'Sedang', 'Rendah'];
    const prioritas = (validPrioritas.includes(resPri.label) ? resPri.label : 'Sedang') as ClassificationResult['prioritas'];

    let score = 50;
    if (prioritas === 'Tinggi') score = 85;
    else if (prioritas === 'Sedang') score = 55;
    else score = 25;

    return {
      kategori: resKat.label as KategoriAduan,
      prioritas,
      score,
      confidenceKategori: resKat.confidence,
      confidencePrioritas: resPri.confidence,
      probabilitiesKategori: resKat.probs,
      probabilitiesPrioritas: resPri.probs,
    };
  } catch (err) {
    console.warn('ML Inference error:', err);
    return {
      kategori: defaultKategori,
      prioritas: 'Sedang',
      score: 50,
    };
  }
}