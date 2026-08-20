import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { decompress } from "wawoff2";
import { readFile } from "node:fs/promises";

const WIDTH = 1200;
const HEIGHT = 630;

let fontsPromise: Promise<
  { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]
> | null = null;

// satori only reads ttf/otf/woff (not woff2) — fontsource only ships woff2,
// so every font load goes through wawoff2 to unpack it first.
function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      [
        [
          "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
          400 as const,
        ],
        [
          "node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2",
          700 as const,
        ],
      ].map(async ([path, weight]) => {
        const woff2 = await readFile(path as string);
        const ttf = await decompress(woff2);
        return {
          name: "Inter",
          data: Buffer.from(ttf),
          weight: weight as 400 | 700,
          style: "normal" as const,
        };
      }),
    );
  }
  return fontsPromise;
}

export async function renderOgImage(params: {
  title: string;
  eyebrow: string;
}): Promise<ArrayBuffer> {
  const { title, eyebrow } = params;
  const fonts = await loadFonts();
  // Roadmap "problem" strings run long — shrink to keep them inside the
  // fixed 630px canvas instead of letting satori overflow silently.
  const titleFontSize = title.length > 90 ? 40 : title.length > 55 ? 48 : 58;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#020617",
          fontFamily: "Inter",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 28,
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: -0.5,
              },
              children: "systems-mastery",
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", gap: 20 },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: 26,
                      fontWeight: 400,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                      letterSpacing: 2,
                    },
                    children: eyebrow,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: titleFontSize,
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.15,
                      letterSpacing: -1,
                    },
                    children: title,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: WIDTH, height: HEIGHT, fonts },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const png = resvg.render().asPng();
  // Node's Buffer is typed over ArrayBufferLike (which also covers
  // SharedArrayBuffer), so TS won't accept it directly as a BodyInit/BlobPart
  // — resvg-js always backs it with a real, non-shared ArrayBuffer, so
  // slicing out a plain copy is a type-only fix, not a behavior change.
  return png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength,
  ) as ArrayBuffer;
}
