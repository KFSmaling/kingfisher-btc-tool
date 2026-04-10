/**
 * BTC Parser — Serverless Function (PDF only)
 * Kingfisher & Partners — April 2026
 * TXT/PPTX/DOCX worden client-side geparsed — geen server, geen size-limiet.
 * Deze functie handelt alleen PDF af.
 */

// Verhoog body size limit voor grote PDF's (default is 1mb)
module.exports.config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { base64, filename } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "Missing base64 or filename" });

  const ext = filename.split(".").pop().toLowerCase();
  if (ext !== "pdf") {
    return res.status(400).json({ error: `Bestandstype .${ext} wordt niet ondersteund via de server.` });
  }

  try {
    // Lazy require — voorkomt crash bij module-load op Vercel
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const buf = Buffer.from(base64, "base64");
    const data = await pdfParse(buf);
    const text = (data.text || "").trim();

    if (text.length < 30) {
      return res.status(422).json({ error: "PDF bevat geen leesbare tekst (mogelijk gescand of afbeelding-gebaseerd)." });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: `PDF parse fout: ${err.message}` });
  }
};
