/**
 * BTC Parser — Serverless Function
 * Kingfisher & Partners — April 2026
 * Converteert PDF / PPTX / DOCX / TXT naar platte tekst. 0 AI-tokens.
 */

const pdfParse = require("pdf-parse");
const JSZip   = require("jszip");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { base64, filename } = req.body;
  if (!base64 || !filename) return res.status(400).json({ error: "Missing base64 or filename" });

  const ext = filename.split(".").pop().toLowerCase();
  const buf = Buffer.from(base64, "base64");

  try {
    let text = "";

    if (ext === "pdf") {
      const data = await pdfParse(buf);
      text = data.text || "";
    }

    else if (ext === "pptx" || ext === "docx") {
      const zip = await JSZip.loadAsync(buf);
      const xmlFiles = [];

      // PPTX: slides zijn in ppt/slides/slide*.xml
      // DOCX: inhoud zit in word/document.xml
      zip.forEach((path, file) => {
        if (
          (ext === "pptx" && path.match(/^ppt\/slides\/slide\d+\.xml$/)) ||
          (ext === "docx" && path === "word/document.xml")
        ) {
          xmlFiles.push(file);
        }
      });

      const xmlContents = await Promise.all(xmlFiles.map(f => f.async("string")));
      // Strip XML-tags, behoud alleen tekst
      text = xmlContents
        .map(xml => xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .join("\n\n");
    }

    else if (ext === "txt" || ext === "csv") {
      text = buf.toString("utf-8");
    }

    else {
      return res.status(400).json({ error: `Bestandstype .${ext} wordt niet ondersteund.` });
    }

    text = text.trim();
    if (text.length < 30) {
      return res.status(422).json({ error: "Bestand bevat geen leesbare tekst." });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: `Parse fout: ${err.message}` });
  }
};
