// Friendly, deterministic pseudonyms for anonymous replies. A codename is derived from a
// submission's seed hash (see seedHash in builders.ts), so it stays stable for a given
// (submitter, topic) pair but differs across topics — the same anonymity properties as the
// accent color, just human-readable.
//
// Distinct codenames = ADJECTIVES.length * NOUNS.length * SuffixRange. The numeric suffix does
// most of the entropy work; enlarging either word list multiplies on top of it.

const ADJECTIVES = [
    "Amber", "Autumn", "Azure", "Bold", "Brave", "Breezy", "Bright", "Bubbly",
    "Calm", "Cheery", "Clever", "Cobalt", "Cosmic", "Cozy", "Crimson", "Crisp",
    "Curious", "Dapper", "Daring", "Deft", "Eager", "Earnest", "Ember", "Fabled",
    "Fancy", "Fleet", "Frosty", "Gallant", "Gentle", "Gilded", "Gleaming", "Golden",
    "Grand", "Hardy", "Hazel", "Honest", "Humble", "Ivory", "Jaunty", "Jolly",
    "Jovial", "Keen", "Kindly", "Lively", "Lucky", "Lunar", "Mellow", "Merry",
    "Mighty", "Nimble", "Noble", "Peppy", "Placid", "Plucky", "Proud", "Quaint",
    "Quick", "Quiet", "Radiant", "Regal", "Rosy", "Rustic", "Sage", "Sandy",
    "Serene", "Sharp", "Shiny", "Silent", "Silken", "Silver", "Sleek", "Snappy",
    "Snowy", "Solar", "Spry", "Stellar", "Stoic", "Sunny", "Swift", "Teal",
    "Tidy", "Trusty", "Valiant", "Velvet", "Vivid", "Witty", "Zany", "Zesty",
];

const NOUNS = [
    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
    "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata",
    "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu",
    "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen", "Nidoran♂",
    "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales",
    "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume",
    "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth",
    "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine",
    "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop",
    "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool",
    "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke",
    "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel",
    "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter",
    "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb",
    "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee",
    "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon",
    "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking",
    "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar",
    "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee",
    "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto",
    "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres",
    "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew"
];

// How many numeric suffixes a codename can end in. Multiplies the word-list space so different
// submitters on the same topic are very unlikely to collide even at high participation.
const SuffixRange = 10000;

export interface CodenameParts {
    adjective: string;
    noun: string;
    // 0-based index into NOUNS; +1 is the noun's National Dex number.
    nounIndex: number;
    // Zero-padded 4-digit suffix, e.g. "0427".
    suffix: string;
}

// All three parts come from independent slices of the hash (successively dividing out each
// component's range), so adjective, noun, and suffix vary independently across the full hash.
export const codenamePartsFromHash = (hash: number): CodenameParts => {
    const adjective = ADJECTIVES[hash % ADJECTIVES.length];
    let rest = Math.floor(hash / ADJECTIVES.length);
    const nounIndex = rest % NOUNS.length;
    rest = Math.floor(rest / NOUNS.length);
    const suffix = (rest % SuffixRange).toString().padStart(4, "0");
    return { adjective, noun: NOUNS[nounIndex], nounIndex, suffix };
};

export const formatCodename = (parts: CodenameParts): string => `${parts.adjective} ${parts.noun} #${parts.suffix}`;

export const codenameFromHash = (hash: number): string => formatCodename(codenamePartsFromHash(hash));
