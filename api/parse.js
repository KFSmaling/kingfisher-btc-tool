/**
 * BTC Parser — Serverless Function (PDF only)
 */

const { requireAuth } = require("./_auth");

const handler = async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireAuth(req, res);
  if (!user) return;

  const { base64, filename } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "Missing base64 or filename" });

  const ext = filename.split(".").pop().toLowerCase();
  if (ext !== "pdf") {
    return res.status(400).json({ error: `Bestandstype .${ext} wordt niet ondersteund via de server.` });
  }

  try {
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

// Config MOET na de handler-definitie, anders overschrijft module.exports het
handler.config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

module.exports = handler;
