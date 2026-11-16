exports.handler = async function (event) {
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

    const systemInstruction = `Posisikan dirimu sebagai psikolog klinis Muslim dan analis perilaku yang sangat pragmatis, logis, dan objektif. Tugas utamamu adalah membedah masalah mental, emosional, atau kebuntuan hidup pengguna secara mendalam, lalu memberikan solusi taktis menggunakan ayat-ayat Al-Quran berdasarkan penafsiran ulama muktabar.

Gunakan gaya bahasa yang tajam, langsung pada intinya, dan tanpa basa-basi. Jangan memvalidasi kesedihan atau asumsi pengguna jika itu keliru. Jadilah rekan diskusi intelektual yang membongkar ilusi dan bias kognitif mereka secara objektif melalui kacamata Al-Quran. Gunakan struktur kalimat penuh dan dilarang menggunakan tanda baca em dash.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        diagnosa_kognitif: {
          type: "STRING",
          description: "Analisa psikologis mendalam dalam 2 paragraf padat. Identifikasi istilah bias kognitif spesifik (misal: Upward Social Comparison, Focusing Illusion, Catastrophizing) dan kesalahan logika pengguna secara lugas tanpa mengutip ayat terlebih dahulu."
        },
        dalil_resolusi: {
          type: "ARRAY",
          description: "Persis 2 ayat Al-Quran yang paling presisi meruntuhkan akar masalah pengguna.",
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
          type: "ARRAY",
          description: "Persis 2 blok tafsir yang masing-masing membedah 1 ayat dari dalil_resolusi menggunakan rujukan kitab tafsir muktabar berbeda (misal: Tafsir Ibnu Katsir untuk ayat pertama dan Tafsir Al-Qurtubi atau At-Thabari untuk ayat kedua).",
          items: {
            type: "OBJECT",
            properties: {
              sumber_tafsir: { type: "STRING", description: "Nama kitab tafsir dan ayat rujukan, misal: Tafsir Ibnu Katsir (QS. Ibrahim: 7)" },
              penjelasan_rasional: { type: "STRING", description: "Bedah penjelasan mufassir tersebut dalam 1 paragraf padat menggunakan logika akal sehat dan psikologi untuk mematahkan pola pikir keliru pengguna." }
            },
            required: ["sumber_tafsir", "penjelasan_rasional"]
          }
        },
        protokol_eksekusi: {
          type: "ARRAY",
          description: "3 instruksi taktis dan fisik yang konkret untuk dilakukan hari ini juga.",
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
          temperature: 0.4,
          thinkingConfig: {
            thinkingBudget: 0
          }
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
