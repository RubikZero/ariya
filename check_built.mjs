import { readFileSync } from "fs";

const js = readFileSync("admin_built.js", "utf-8");

// Find the inline script content (the HTML template literal in admin.ts)
const m = js.match(/<script>([\s\S]*?)<\x2Fscript>/);
if (!m) {
  console.log("No script match found");
  console.log("Trying alternative regex...");
  // Search for the pattern differently
  const idx = js.indexOf("<script>");
  const endIdx = js.indexOf("</script>", idx);
  if (idx >= 0 && endIdx >= 0) {
    const code = js.substring(idx + 8, endIdx);
    console.log("Found with indexOf, length:", code.length);
    checkSyntax(code);
  } else {
    console.log("script at", idx, "end script at", endIdx);
    // Show what comes after script tag
    if (idx >= 0) console.log(js.substring(idx, idx + 200));
  }
} else {
  console.log("Found with regex, length:", m[1].length);
  checkSyntax(m[1]);
}

function checkSyntax(code) {
  try {
    new Function(code);
    console.log("JS SYNTAX: OK");
  } catch (e) {
    console.log("JS SYNTAX ERROR:", e.message);
    const lines = code.split("\n");
    const errMatch = e.message.match(/position (\d+)/);
    if (errMatch) {
      const pos = parseInt(errMatch[1]);
      let lineNum = 1;
      let charPos = 0;
      for (let i = 0; i < lines.length; i++) {
        charPos += lines[i].length + 1;
        if (charPos >= pos) { lineNum = i + 1; break; }
      }
      for (let i = Math.max(0, lineNum - 2); i < Math.min(lines.length, lineNum + 2); i++) {
        console.log(`${i + 1}: ${lines[i].substring(0, 250)}`);
      }
    }
  }
}
