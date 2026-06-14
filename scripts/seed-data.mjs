import { execSync } from "child_process";
import { createHash, randomInt } from "crypto";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MODS = ["sts2-mod-core","sts2-mod-hub","sts2-mod-better","sts2-mod-fix","sts2-mod-tweaks"];
const EXCEPTIONS = [
  ["NullReferenceException: Object reference not set to an instance of an object","at GameLogic.Update() in GameLogic.cs:42\\nat GameManager.RunFrame() in GameManager.cs:156\\nat GameLoop.Tick() in GameLoop.cs:89"],
  ["IndexOutOfRangeException: Index was outside the bounds of the array","at DeckManager.GetCard(Int32 index) in DeckManager.cs:78\\nat CombatManager.DrawCards() in CombatManager.cs:203"],
  ["ArgumentException: An item with the same key has already been added","at StatusManager.AddStatus(Status status) in StatusManager.cs:55\\nat RelicManager.OnCombatStart() in RelicManager.cs:120"],
  ["InvalidOperationException: Sequence contains no elements","at EnemyGroup.GetAliveEnemies() in EnemyGroup.cs:34\\nat CombatManager.AutoTarget() in CombatManager.cs:310"],
  ["FileNotFoundException: Could not load file or assembly","at ModLoader.LoadMod(String path) in ModLoader.cs:67\\nat ModManager.Initialize() in ModManager.cs:22"],
  ["KeyNotFoundException: The given key was not present in the dictionary","at SaveManager.LoadField(String key) in SaveManager.cs:44\\nat RunManager.RestoreState() in RunManager.cs:95"],
  ["TimeoutException: Operation timed out","at NetworkManager.SyncState() in NetworkManager.cs:112\\nat MultiplayerGame.Sync() in MultiplayerGame.cs:67"],
  ["OverflowException: Arithmetic operation resulted in an overflow","at ScoreCalculator.ComputeScore() in ScoreCalculator.cs:28\\nat RunManager.EndRun() in RunManager.cs:201"],
  ["DivideByZeroException: Attempted to divide by zero","at DamageCalculator.CalculateDamage() in DamageCalculator.cs:55\\nat CombatManager.DealDamage() in CombatManager.cs:178"],
  ["MissingMethodException: Method not found","at PatchManager.ApplyPatch() in PatchManager.cs:90\\nat ModLoader.LoadAssemblies() in ModLoader.cs:133"],
];
const SCENES = ["MainMenu","CombatRoom","MapRoom","EventRoom","RestSiteRoom","MerchantRoom","TreasureRoom","LogoAnimation","Run"];
const ENEMIES = ["Gremlin","Slime","Sentinel","Cultist","Jaw Worm","Louse","Slaver","Spheric Guardian"];
const CHARS = ["ironclad","silent","defect","watcher"];

function pick(a) { return a[randomInt(0,a.length)]; }

function randState() {
  const s = pick(SCENES);
  const o = {};
  o["loc.language"] = pick(["zh-CN","en","ja","ko"]);
  o["game.scene"] = s;
  if (s !== "MainMenu" && s !== "LogoAnimation") {
    o["game.in_run"] = "true";
    o["game.seed"] = Array.from({length:8},()=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[randomInt(0,36)]).join("");
    o["game.ascension"] = randomInt(0,21);
    o["game.act"] = randomInt(1,4);
    o["game.floor"] = randomInt(1,56);
    o["game.mode"] = pick(["Standard","Daily","Endless","Custom"]);
    o["game.room_type"] = pick(["CombatRoom","EventRoom","RestSiteRoom","MerchantRoom","TreasureRoom","MapRoom"]);
    o["game.characters"] = pick(CHARS);
    o["game.player_count"] = 1;
  } else { o["game.in_run"] = "false"; }
  if (s === "CombatRoom") {
    o["combat.round"] = randomInt(1,15);
    o["combat.enemy_count"] = randomInt(1,4);
    o["combat.enemies"] = Array.from({length:randomInt(1,4)},()=>pick(ENEMIES)).join(", ");
    o["combat.player_hp"] = Array.from({length:randomInt(1,3)},()=>`${randomInt(10,80)}/${randomInt(20,80)}`).join(", ");
  }
  return JSON.stringify(o);
}

const seen = new Set();
let rows = [];
const now = Date.now();

for (let i = 0; i < 3000 && rows.length < 1000; i++) {
  const modId = pick(MODS);
  const modVer = `${randomInt(1,5)}.${randomInt(0,9)}.${randomInt(0,20)}`;
  const gameVer = `2.${randomInt(0,5)}`;
  const ex = pick(EXCEPTIONS);
  const errMsg = ex[0];
  const stackTrace = ex[1];
  const input = [modId, modVer, gameVer, errMsg, stackTrace].join("|");
  const hash = createHash("sha256").update(input).digest("hex");
  if (seen.has(hash)) continue;
  seen.add(hash);

  const gs = randState().replace(/'/g, "''");
  const os = pick(["Windows","macOS","Linux","Steam Deck"]);
  const osVer = os === "Windows" ? `10.0.${randomInt(10000,30000)}` : os === "macOS" ? `${randomInt(10,15)}.${randomInt(0,6)}` : os === "Linux" ? `6.${randomInt(1,12)}.${randomInt(0,20)}` : "5.13.0";
  const ct = now - randomInt(0,30)*86400000 - randomInt(0,86400000);
  const cnt = randomInt(1,10);

  const esc = (s) => s ? s.replace(/'/g, "''") : "";
  rows.push(`('${hash}','${esc(modId)}','${esc(modVer)}','${esc(gameVer)}','${esc(errMsg)}','${esc(stackTrace)}','${gs}','${esc(os)}','${esc(osVer)}',${cnt},${ct})`);
}

const outFile = join(ROOT, "scripts", "seed.sql");
const BATCH = 50;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const sql = "INSERT OR IGNORE INTO mod_errors (hash,mod_id,mod_version,game_version,error_message,stack_trace,game_state,player_os,os_version,count,created_at) VALUES\n" + batch.join(",\n") + ";";
  writeFileSync(outFile, sql);
  try {
    execSync(`npx wrangler d1 execute DB --local --file "${outFile}"`, { cwd: ROOT, stdio: "pipe", timeout: 30000 });
  } catch(e) {
    // If batch fails, try individual inserts
    console.log(`Batch ${i} failed, retrying individually...`);
    for (let j = i; j < Math.min(i + BATCH, rows.length); j++) {
      const single = "INSERT OR IGNORE INTO mod_errors (hash,mod_id,mod_version,game_version,error_message,stack_trace,game_state,player_os,os_version,count,created_at) VALUES " + rows[j] + ";";
      writeFileSync(outFile, single);
      try { execSync(`npx wrangler d1 execute DB --local --file "${outFile}"`, { cwd: ROOT, stdio: "pipe", timeout: 10000 }); }
      catch(e2) { console.log(`  Row ${j} failed`); }
    }
  }
  process.stdout.write(`\rInserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
}
console.log("\nDone!");
