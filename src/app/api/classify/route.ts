import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { classifyReport } from '@/lib/classifier';
import { LIST_KATEGORI } from '@/lib/supabase';

const SYSTEM_PROMPT = `
Kamu adalah sistem AI klasifikasi pengaduan infrastruktur desa SIGAP Desa.
Tugasmu adalah menganalisis teks laporan warga dan mengekstrak kategori serta prioritas penanganan dalam format JSON murni.

Kategori yang valid (PILIH SALAH SATU):
- Jalan & Jembatan
- Penerangan Jalan
- Drainase & Irigasi
- Air Bersih & Sanitasi
- Persampahan & Lingkungan
- Gedung & Sarana Publik
- Bencana & Darurat
- Masalah Lainnya

Prioritas yang valid (PILIH SALAH SATU):
- Tinggi: Membahayakan keselamatan jiwa, ada korban, memutus akses utama, bencana alam aktif, kebakaran, kabel beraliran listrik mengelupas, banjir masuk rumah warga.
- Sedang: Kerusakan mengganggu fungsi fasilitas umum namun tidak mengancam nyawa secara langsung.
- Rendah: Kerusakan estetika minor, perawatan berkala, fungsi fasilitas masih berjalan normal.

Panduan Analisis:
- Pahami konteks negasi (contoh: "bukan jalan rusak tapi lampunya mati" -> Penerangan Jalan).
- Pahami bahasa daerah/slang Jawa pedesaan (contoh: "kalen mampet", "blethok", "cagak listrik kobong", "dalan ambles").
- Berikan skor keyakinan 'confidence' (antara 50 sampai 99).
- Berikan alasan singkat 'alasan' dalam 1 kalimat bahasa Indonesia.

Format output WAJIB berupa objek JSON valid persis seperti ini:
{
  "kategori": "...",
  "prioritas": "...",
  "confidence": 95,
  "alasan": "..."
}
`;

export async function POST(req: Request) {
  let bodyText = '';
  let fallbackKategori = 'Jalan & Jembatan';
  let fallbackPrioritas = 'Sedang';

  try {
    const body = await req.json();
    bodyText = body?.text || '';
    fallbackKategori = body?.fallbackKategori || fallbackKategori;
    fallbackPrioritas = body?.fallbackPrioritas || fallbackPrioritas;

    if (!bodyText || bodyText.trim().length < 4) {
      return NextResponse.json({
        kategori: 'Masalah Lainnya',
        prioritas: 'Rendah',
        confidence: 0,
        alasan: 'Teks laporan terlalu pendek',
        source: 'local',
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // 1. LAYER 1: If Groq API Key is configured, try Groq Cloud LLM
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Laporan Warga: "${bodyText.trim()}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 250,
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (responseContent) {
          const parsed = JSON.parse(responseContent);

          const isValidCategory = (LIST_KATEGORI as readonly string[]).includes(parsed.kategori);
          const isValidPriority = ['Tinggi', 'Sedang', 'Rendah'].includes(parsed.prioritas);

          const finalKategori = isValidCategory ? parsed.kategori : fallbackKategori;
          const finalPrioritas = isValidPriority ? parsed.prioritas : fallbackPrioritas;

          return NextResponse.json({
            kategori: finalKategori,
            prioritas: finalPrioritas,
            confidence: parsed.confidence || 98,
            alasan: parsed.alasan || 'Dianalisis oleh AI LLM (Groq Cloud)',
            source: 'groq-llm',
          });
        }
      } catch (groqErr: any) {
        console.warn('Groq LLM API failed/rate-limited, falling back to Local Model:', groqErr.message);
      }
    }

    // 2. LAYER 2: Fallback to Local Machine Learning (TF-IDF + Linear Classifier)
    const localResult = classifyReport(bodyText);

    return NextResponse.json({
      kategori: localResult.kategori,
      prioritas: localResult.prioritas,
      confidence: localResult.confidenceKategori || 85,
      alasan: 'Dianalisis oleh Model AI Lokal (TF-IDF)',
      source: 'local-model',
    });
  } catch (err: any) {
    console.error('Classification error:', err);
    const fallback = classifyReport(bodyText);

    return NextResponse.json({
      kategori: fallback.kategori || fallbackKategori,
      prioritas: fallback.prioritas || fallbackPrioritas,
      confidence: 70,
      alasan: 'Fallback Model Lokal',
      source: 'local-fallback',
    });
  }
}
