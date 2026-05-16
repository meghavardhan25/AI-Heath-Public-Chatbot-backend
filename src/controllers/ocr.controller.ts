import { Response } from "express";
import Tesseract from "tesseract.js";
import type { Request } from "express";

type MulterRequest = Request & { file?: Express.Multer.File };

/** Map UI locale (en, zh, …) to Tesseract language codes. */
function tessLangFromUiLocale(ui: string): string {
  const two = ui.toLowerCase().slice(0, 2);
  const map: Record<string, string> = {
    en: "eng",
    es: "spa",
    fr: "fra",
    hi: "hin",
    zh: "chi_sim",
    de: "deu",
    pt: "por",
    ja: "jpn",
    ko: "kor",
  };
  return map[two] ?? "eng";
}

export async function ocrFromUpload(req: MulterRequest, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer?.length) {
    res.status(400).json({ error: "Image file is required (multipart field: image)." });
    return;
  }

  const uiLocale = String(req.query.locale ?? "en").trim() || "en";
  const lang = tessLangFromUiLocale(uiLocale);

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(file.buffer, lang, {
      logger: () => undefined,
    });
    res.json({ text: text.trim(), lang });
  } catch (e) {
    console.error("[ocr]", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "OCR failed",
    });
  }
}
