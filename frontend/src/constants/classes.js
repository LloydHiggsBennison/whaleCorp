// frontend/src/constants/classes.js
export const CLASSES = [
  { key: "aeromancer", name: "Aeromancer", image: "/assets/classes/aeromancer.png" },
  { key: "arcanist", name: "Arcanist", image: "/assets/classes/arcanist.png" },
  { key: "artillerist", name: "Artillerist", image: "/assets/classes/artillerist.png" },
  { key: "artist", name: "Artist", image: "/assets/classes/artist.png" },
  { key: "bard", name: "Bard", image: "/assets/classes/bard.png" },
  { key: "breaker", name: "Breaker", image: "/assets/classes/breaker.png" },
  { key: "deadeye", name: "Deadeye", image: "/assets/classes/deadeye.png" },
  { key: "death blade", name: "Deathblade", image: "/assets/classes/deathblade.png" },
  { key: "destroyer", name: "Destroyer", image: "/assets/classes/destroyer.png" },
  { key: "glavier", name: "Glavier", image: "/assets/classes/glavier.png" },
  { key: "gunlancer", name: "Gunlancer", image: "/assets/classes/gunlancer.png" },
  { key: "machinist", name: "Machinist", image: "/assets/classes/machinist.png" },
  { key: "paladin", name: "Paladin", image: "/assets/classes/paladin.png" },
  { key: "reaper", name: "Reaper", image: "/assets/classes/reaper.png" },
  { key: "scrapper", name: "Scrapper", image: "/assets/classes/scrapper.png" },
  { key: "shadow hunter", name: "Shadowhunter", image: "/assets/classes/shadow_hunter.png" },
  { key: "sharpshooter", name: "Sharpshooter", image: "/assets/classes/sharpshooter.png" },
  { key: "sorceress", name: "Sorceress", image: "/assets/classes/sorceress.png" },
  { key: "soul eater", name: "Soul Eater", image: "/assets/classes/soul_eater.png" },
  { key: "soul fist", name: "Soul Fist", image: "/assets/classes/soul_fist.png" },
  { key: "striker", name: "Striker", image: "/assets/classes/striker.png" },
  { key: "summoner", name: "Summoner", image: "/assets/classes/summoner.png" },
  { key: "valkyrie", name: "Valkyrie", image: "/assets/classes/valkyrie.png" },
  { key: "wardancer", name: "Wardancer", image: "/assets/classes/wardancer.png" },
  { key: "wild soul", name: "Wild Soul", image: "/assets/classes/wild_soul.png" },
];

// Mapa útil para búsquedas rápidas por key
export const CLASS_BY_KEY = Object.fromEntries(CLASSES.map(c => [c.key, c]));
