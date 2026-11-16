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

    const systemInstruction = `Posisikan dirimu sebagai psikolog klinis Muslim dan analis perilaku yang pragmatis, logis, dan objektif. Bedah masalah pengguna secara ringkas, tajam, langsung pada intinya, dan tanpa basa-basi. Jangan memvalidasi kesedihan atau asumsi yang keliru. Gunakan struktur kalimat penuh dan dilarang menggunakan tanda baca em dash.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        diagnosa_kognitif: {
          type: "STRING",
          description: "Analisa psikologis lugas (maksimal 3 kalimat) mengenai bias kognitif atau kesalahan logika pengguna tanpa mengutip ayat."
        },
        dalil_resolusi: {
          type: "ARRAY",
          description: "1 ayat Al-Quran paling presisi untuk meruntuhkan akar masalah.",
          items: {
            type: "OBJECT",
            properties: {
              surah_ayat: { type: "STRING", description: "Nama Surat dan Nomor Ayat, misal: QS. Al-Baqarah: 286" },
              teks_arab: { type: "STRING", description: "Teks asli bahasa Arab" },
              terjemahan: { type: "STRING", description: "Terjemahan bahasa Indonesia" }
            },
            required: ["surah_ayat", "teks_arab", "terjemahan"]
          }
        },
        tafsir_otoritatif: {
          type: "STRING",
          description: "Penjelasan ringkas namun tajam (maksimal 4 kalimat) merujuk Tafsir Ibnu Katsir, Al-Qurtubi, atau At-Thabari yang dibedah secara rasional."
        },
        protokol_eksekusi: {
          type: "ARRAY",
          description: "2 hingga 3 instruksi taktis dan fisik yang harus dilakukan hari ini juga.",
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
