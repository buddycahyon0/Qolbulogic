export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY belum disetting di Netlify." }) };
  }

  try {
    const { problem } = JSON.parse(event.body);
    if (!problem || !problem.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Input masalah tidak boleh kosong." }) };
    }

    const systemInstruction = `Posisikan dirimu sebagai seorang psikolog klinis Muslim dan analis perilaku yang sangat pragmatis, logis, dan objektif. Tugas utamamu adalah membedah masalah mental, emosional, atau kebuntuan hidup pengguna, lalu memberikan solusi taktis menggunakan prinsip dasar dan ayat-ayat Al-Quran berdasarkan penafsiran ulama yang otoritatif.

Gunakan gaya bahasa yang tajam, langsung pada intinya, tanpa basa-basi, dan ringkas padat agar cepat dibaca. Jangan memvalidasi kesedihan atau asumsi pengguna jika itu salah. Jadilah rekan diskusi intelektual yang membongkar ilusi mereka dan memaksa mereka melihat realita secara objektif melalui kacamata Al-Quran. Gunakan struktur kalimat penuh dan dilarang menggunakan tanda baca em dash.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        diagnosa_kognitif: {
          type: "STRING",
          description: "Analisa psikologis lugas mengenai bias kognitif, ego, ekspektasi palsu, atau kesalahan logika pengguna tanpa mengutip ayat terlebih dahulu."
        },
        dalil_resolusi: {
          type: "ARRAY",
          description: "1 hingga maksimal 2 ayat Al-Quran yang paling presisi meruntuhkan akar masalah.",
          items: {
            type: "OBJECT",
            properties: {
              surah_ayat: { type: "STRING", description: "Nama Surat dan Nomor Ayat, misal: QS. Al-Baqarah: 286" },
              teks_arab: { type: "STRING", description: "Teks asli bahasa Arab berharakat lengkap" },
              terjemahan: { type: "STRING", description: "Terjemahan bahasa Indonesia yang akurat" }
            },
            required: ["surah_ayat", "teks_arab", "terjemahan"]
          }
        },
        tafsir_otoritatif: {
          type: "STRING",
          description: "Penjelasan merujuk kitab tafsir muktabar (Tafsir Ibnu Katsir, Tafsir Al-Qurtubi, atau Tafsir At-Thabari) yang dibedah secara rasional dan psikologis untuk mematahkan pola pikir keliru pengguna."
        },
        protokol_eksekusi: {
          type: "ARRAY",
          description: "2 hingga 3 instruksi taktis dan fisik yang harus dilakukan pengguna hari ini juga.",
          items: { type: "STRING" }
        }
      },
      required: ["diagnosa_kognitif", "dalil_resolusi", "tafsir_otoritatif", "protokol_eksekusi"]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: problem }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.4
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gagal menghubungi Gemini API");
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: resultText
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
