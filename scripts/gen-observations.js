// Generates data/observations.json (sample data). Run: node scripts/gen-observations.js
const fs = require("fs");
const o = [];
let n = 0;
function add(s, by, d, c, sm, sp, l, w, notes) {
  n++;
  const r = { id: "obs-" + String(n).padStart(2, "0"), streamId: s, observerId: by, observedAt: d, clarity: c, smell: sm, species: sp, litter: l, weather: w, status: "accepted", flags: [] };
  if (notes) r.notes = notes;
  o.push(r);
}
const M = "berrys-creek", H = "mill-creek", R = "overpeck-creek";
add(M, "o1", "2026-08-06", 4, "none", ["mayfly nymph", "caddisfly larva", "stonefly nymph", "heron"], 0, "dry");
add(M, "o2", "2026-08-14", 4, "earthy", ["mayfly nymph", "caddisfly larva", "frog"], 1, "dry");
add(M, "o3", "2026-08-24", 5, "none", ["mayfly nymph", "stonefly nymph", "minnow", "dragonfly nymph"], 0, "dry");
add(M, "o1", "2026-09-04", 3, "earthy", ["water strider", "midge larva"], 1, "dry");
add(M, "o4", "2026-09-11", 2, "earthy", ["midge larva"], 1, "light_rain");
add(M, "o2", "2026-09-18", 3, "none", ["water strider"], 2, "heavy_rain", "Water looked brown after the storm.");
add(M, "o5", "2026-09-25", 2, "earthy", ["midge larva", "water strider"], 1, "dry");
add(M, "o6", "2026-09-27", 1, "sewage", ["fish", "mayfly nymph", "heron", "frog"], 2, "dry", "Fish and many species seen near the culvert.");
add(H, "o3", "2026-08-08", 4, "none", ["heron", "minnow", "caddisfly larva", "mayfly nymph", "frog"], 0, "dry");
add(H, "o5", "2026-08-17", 5, "none", ["heron", "minnow", "stonefly nymph", "duck"], 0, "dry");
add(H, "o1", "2026-08-26", 4, "earthy", ["mayfly nymph", "caddisfly larva", "frog", "heron", "dragonfly nymph"], 0, "dry");
add(H, "o3", "2026-09-05", 4, "none", ["heron", "minnow", "mayfly nymph", "frog"], 0, "dry");
add(H, "o4", "2026-09-12", 5, "none", ["heron", "caddisfly larva", "stonefly nymph", "duck", "minnow"], 0, "dry");
add(H, "o5", "2026-09-20", 4, "earthy", ["mayfly nymph", "frog", "dragonfly nymph", "heron"], 0, "dry");
add(H, "o2", "2026-09-26", 4, "none", ["heron", "minnow", "caddisfly larva", "frog"], 1, "dry");
add(H, "o6", "2026-09-28", 5, "none", ["heron", "minnow"], 0, "dry", "Green scum on surface near the bank.");
add(R, "o2", "2026-08-05", 2, "other", ["midge larva"], 3, "dry");
add(R, "o4", "2026-08-15", 2, "earthy", ["midge larva", "duck"], 2, "dry");
add(R, "o2", "2026-08-27", 3, "none", ["duck"], 3, "dry");
add(R, "o3", "2026-09-03", 4, "none", ["midge larva", "duck", "water strider"], 1, "dry");
add(R, "o4", "2026-09-13", 4, "none", ["duck", "water strider", "minnow"], 1, "dry");
add(R, "o6", "2026-09-21", 3, "earthy", ["duck", "frog", "midge larva", "minnow"], 0, "light_rain");
add(R, "o2", "2026-09-26", 4, "none", ["duck", "minnow", "crayfish"], 1, "dry");
add(R, "o5", "2026-09-29", 3, "none", ["duck", "frog"], 0, "dry", "Bags of trash along the bank.");
fs.writeFileSync("data/observations.json", JSON.stringify(o, null, 2));
