/**
 * GET /api/generate-password
 *
 * Generates a memorable passphrase-style password.
 * Format: word-word-word@digits  (e.g. contact-puffy-slender@839)
 *
 * Query params:
 *   words  — number of words (2 or 3, default: 3)
 *   digits — number of trailing digits (2–4, default: 3)
 *
 * Returns: { password: string, source: "local" }
 *
 * Runs server-side so the word list isn't bundled into the client.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// ── Word list ─────────────────────────────────────────────────────────────────
// ~200 common, easy-to-read English words (4–8 letters).
// Deliberately avoids ambiguous or offensive words.

const WORDS = [
  "able","acid","aged","also","area","army","away","baby","back","ball",
  "band","bank","base","bath","bear","beat","been","bell","best","bird",
  "bite","blue","boat","body","bold","bone","book","born","both","bowl",
  "busy","calm","camp","card","care","cart","case","cash","cast","cave",
  "chef","chip","city","clam","clan","clay","clip","club","coal","coat",
  "code","coil","cold","come","cook","cool","copy","core","corn","cost",
  "cozy","crew","crop","cube","cure","cute","dark","data","date","dawn",
  "days","dead","deal","dear","deck","deep","deer","desk","dial","diet",
  "dirt","disk","dock","dome","door","dose","dove","down","draw","drop",
  "drum","dual","dull","dusk","dust","duty","each","earn","east","easy",
  "edge","else","epic","even","ever","exam","face","fact","fair","fall",
  "fame","farm","fast","fate","feel","feet","fell","felt","file","fill",
  "film","find","fine","fire","firm","fish","fist","flag","flat","flew",
  "flip","flow","foam","fold","folk","fond","font","food","foot","ford",
  "fork","form","fort","free","from","fuel","full","fund","fuse","gain",
  "game","gate","gave","gear","gift","give","glad","glow","glue","goal",
  "gold","golf","good","grab","gray","grew","grid","grin","grip","grow",
  "gulf","gust","half","hall","hand","hang","hard","harm","harp","hash",
  "have","hawk","head","heal","heap","heat","heel","held","help","herb",
  "here","hero","hide","high","hill","hint","hold","hole","home","hook",
  "hope","horn","host","hour","huge","hull","hunt","hurt","idea","idle",
  "inch","into","iron","isle","item","jade","jail","jazz","join","joke",
  "jump","just","keen","keep","kind","king","knot","know","lace","lake",
  "lamp","land","lane","last","late","lawn","lead","leaf","lean","leap",
  "left","lens","life","lift","like","lime","line","link","lion","list",
  "live","load","lock","loft","lone","long","look","loop","lore","lost",
  "loud","love","luck","lush","made","mail","main","make","male","mall",
  "malt","many","mark","mars","mask","mass","mast","math","maze","meal",
  "mean","meet","melt","menu","mesh","mild","milk","mill","mind","mine",
  "mint","miss","mist","mode","mold","moon","more","most","move","much",
  "mule","must","nail","name","navy","near","neck","need","nest","next",
  "nice","nine","node","none","noon","norm","note","nova","null","oath",
  "obey","odds","once","only","open","oral","oval","over","pace","pack",
  "page","paid","pain","pair","pale","palm","park","part","pass","past",
  "path","peak","peel","peer","pick","pile","pine","pink","pipe","plan",
  "play","plot","plow","plug","plus","poem","poet","pole","poll","pond",
  "pool","poor","port","pose","post","pour","prey","prod","prop","pull",
  "pump","pure","push","puffy","quad","quiz","race","rack","rain","ramp",
  "rank","rare","rate","read","real","reed","reef","reel","rely","rent",
  "rest","rice","rich","ride","ring","rise","risk","road","roam","roar",
  "rock","role","roll","roof","room","root","rope","rose","rout","ruby",
  "rule","rush","rust","safe","sage","sail","salt","same","sand","save",
  "scan","seal","seed","seek","self","sell","send","sent","shed","ship",
  "shop","shot","show","shut","side","sign","silk","silo","sing","sink",
  "site","size","skin","skip","slab","slam","slap","slim","slip","slow",
  "slug","snap","snow","soap","sock","soft","soil","sold","sole","some",
  "song","soon","sort","soul","soup","span","spin","spot","star","stay",
  "stem","step","stir","stop","stub","such","suit","sung","surf","swap",
  "swim","tail","take","tale","tall","tank","tape","task","team","tear",
  "tell","tend","tent","term","test","text","than","that","them","then",
  "they","thin","this","tide","tile","time","tiny","tire","toad","told",
  "toll","tone","tool","tops","toss","tour","town","trap","tree","trim",
  "trip","true","tube","tuck","tune","turn","twin","type","unit","upon",
  "used","user","vast","very","view","vine","void","volt","vote","wade",
  "wage","wake","walk","wall","wand","warm","warp","wary","wave","weak",
  "weld","well","went","west","what","when","wide","wild","will","wind",
  "wine","wing","wire","wise","wish","with","wolf","wood","word","work",
  "worm","wrap","yard","year","your","zero","zone","zoom","slender","brave",
  "swift","noble","grand","vivid","crisp","sharp","clean","fresh","bright",
  "smart","quick","light","solid","round","quiet","proud","plain","lucky",
  "happy","sunny","windy","rainy","snowy","foggy","dusty","rusty","silky",
  "spicy","salty","sweet","sour","bitter","tangy","minty","smoky","nutty",
  "contact","silver","golden","copper","marble","velvet","cotton","linen",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickWord(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return WORDS[arr[0] % WORDS.length];
}

function pickDigits(count: number): string {
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((n) => n % 10)
    .join("");
}

const SEPARATORS = ["-", ".", "_"];
const SYMBOLS = ["@", "#", "!", "$", "&"];

function pickFrom(arr: string[]): string {
  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  return arr[rand[0] % arr.length];
}

/**
 * Generate a passphrase-style password.
 * Format: word{sep}word{sep}word{sym}digits
 * Example: contact-puffy-slender@839
 */
function generatePassphrase(wordCount: number, digitCount: number): string {
  const sep = pickFrom(SEPARATORS);
  const sym = pickFrom(SYMBOLS);
  const words = Array.from({ length: wordCount }, pickWord);
  const digits = pickDigits(digitCount);
  return `${words.join(sep)}${sym}${digits}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Require an authenticated session
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wordCount = Math.max(2, Math.min(4, Number(searchParams.get("words") ?? 3)));
  const digitCount = Math.max(2, Math.min(4, Number(searchParams.get("digits") ?? 3)));

  const password = generatePassphrase(wordCount, digitCount);

  return NextResponse.json({ password, source: "local" });
}
