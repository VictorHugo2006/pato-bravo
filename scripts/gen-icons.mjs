import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appleSvg = fileURLToPath(new URL("../app/apple-icon.svg", import.meta.url));
const out = fileURLToPath(new URL("../app/apple-icon.png", import.meta.url));

// apple-icon precisa ser PNG (iOS não aceita SVG em apple-touch-icon)
await sharp(readFileSync(appleSvg)).resize(180, 180).png().toFile(out);

console.log("apple-icon.png gerado (180x180) ->", out);
