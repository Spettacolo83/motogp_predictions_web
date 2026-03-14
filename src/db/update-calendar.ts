import Database from "better-sqlite3";

/**
 * Calendar update script for MotoGP 2026.
 * Updates existing race rows by round number, preserving UUIDs and all FK relationships.
 * Safe to run multiple times (idempotent).
 * Does NOT touch: id, status, isResultConfirmed, newDate, season.
 */

const dbPath = process.env.DATABASE_URL || "./sqlite.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const updatedCalendar = [
  { round: 1, name: "Grand Prix of Thailand", nameIt: "Gran Premio della Thailandia", circuit: "Chang International Circuit", circuitIt: "Circuito Internazionale di Chang", country: "Thailand", countryIt: "Thailandia", countryCode: "TH", date: "2026-03-01", trackImage: "/tracks/thailand.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/tha/motogp/rac/classification" },
  { round: 2, name: "Grand Prix of Brazil", nameIt: "Gran Premio del Brasile", circuit: "Autódromo Internacional Ayrton Senna", circuitIt: "Autodromo Internazionale Ayrton Senna", country: "Brazil", countryIt: "Brasile", countryCode: "BR", date: "2026-03-22", trackImage: "/tracks/brazil.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/bra/motogp/rac/classification" },
  { round: 3, name: "Grand Prix of the Americas", nameIt: "Gran Premio delle Americhe", circuit: "Circuit of the Americas", circuitIt: "Circuito delle Americhe", country: "United States", countryIt: "Stati Uniti", countryCode: "US", date: "2026-03-29", trackImage: "/tracks/americas.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ame/motogp/rac/classification" },
  { round: 4, name: "Grand Prix of Qatar", nameIt: "Gran Premio del Qatar", circuit: "Lusail International Circuit", circuitIt: "Circuito Internazionale di Lusail", country: "Qatar", countryIt: "Qatar", countryCode: "QA", date: "2026-04-12", trackImage: "/tracks/qatar.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/qat/motogp/rac/classification" },
  { round: 5, name: "Grand Prix of Spain", nameIt: "Gran Premio di Spagna", circuit: "Circuito de Jerez - Angel Nieto", circuitIt: "Circuito di Jerez - Angel Nieto", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-04-26", trackImage: "/tracks/spain-jerez.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/spa/motogp/rac/classification" },
  { round: 6, name: "Grand Prix of France", nameIt: "Gran Premio di Francia", circuit: "Le Mans", circuitIt: "Le Mans", country: "France", countryIt: "Francia", countryCode: "FR", date: "2026-05-10", trackImage: "/tracks/france.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/fra/motogp/rac/classification" },
  { round: 7, name: "Grand Prix of Catalonia", nameIt: "Gran Premio di Catalogna", circuit: "Circuit de Barcelona-Catalunya", circuitIt: "Circuito di Barcellona-Catalogna", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-05-17", trackImage: "/tracks/catalonia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/cat/motogp/rac/classification" },
  { round: 8, name: "Grand Prix of Italy", nameIt: "Gran Premio d'Italia", circuit: "Autodromo del Mugello", circuitIt: "Autodromo del Mugello", country: "Italy", countryIt: "Italia", countryCode: "IT", date: "2026-05-31", trackImage: "/tracks/italy-mugello.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ita/motogp/rac/classification" },
  { round: 9, name: "Grand Prix of Hungary", nameIt: "Gran Premio d'Ungheria", circuit: "Balaton Park Circuit", circuitIt: "Circuito Balaton Park", country: "Hungary", countryIt: "Ungheria", countryCode: "HU", date: "2026-06-07", trackImage: "/tracks/hungary.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/hun/motogp/rac/classification" },
  { round: 10, name: "Grand Prix of Czech Republic", nameIt: "Gran Premio della Repubblica Ceca", circuit: "Automotodrom Brno", circuitIt: "Automotodrom Brno", country: "Czech Republic", countryIt: "Repubblica Ceca", countryCode: "CZ", date: "2026-06-21", trackImage: "/tracks/czech-republic.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/cze/motogp/rac/classification" },
  { round: 11, name: "Grand Prix of the Netherlands", nameIt: "Gran Premio dei Paesi Bassi", circuit: "TT Circuit Assen", circuitIt: "TT Circuit Assen", country: "Netherlands", countryIt: "Paesi Bassi", countryCode: "NL", date: "2026-06-28", trackImage: "/tracks/netherlands.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ned/motogp/rac/classification" },
  { round: 12, name: "Grand Prix of Germany", nameIt: "Gran Premio di Germania", circuit: "Sachsenring", circuitIt: "Sachsenring", country: "Germany", countryIt: "Germania", countryCode: "DE", date: "2026-07-12", trackImage: "/tracks/germany.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ger/motogp/rac/classification" },
  { round: 13, name: "Grand Prix of Great Britain", nameIt: "Gran Premio di Gran Bretagna", circuit: "Silverstone Circuit", circuitIt: "Circuito di Silverstone", country: "Great Britain", countryIt: "Gran Bretagna", countryCode: "GB", date: "2026-08-09", trackImage: "/tracks/great-britain.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/gbr/motogp/rac/classification" },
  { round: 14, name: "Grand Prix of Aragon", nameIt: "Gran Premio di Aragona", circuit: "MotorLand Aragon", circuitIt: "MotorLand Aragona", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-08-30", trackImage: "/tracks/aragon.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ara/motogp/rac/classification" },
  { round: 15, name: "Grand Prix of San Marino", nameIt: "Gran Premio di San Marino", circuit: "Misano World Circuit", circuitIt: "Misano World Circuit", country: "San Marino", countryIt: "San Marino", countryCode: "SM", date: "2026-09-13", trackImage: "/tracks/san-marino.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/smr/motogp/rac/classification" },
  { round: 16, name: "Grand Prix of Austria", nameIt: "Gran Premio d'Austria", circuit: "Red Bull Ring", circuitIt: "Red Bull Ring", country: "Austria", countryIt: "Austria", countryCode: "AT", date: "2026-09-20", trackImage: "/tracks/austria.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/aut/motogp/rac/classification" },
  { round: 17, name: "Grand Prix of Japan", nameIt: "Gran Premio del Giappone", circuit: "Mobility Resort Motegi", circuitIt: "Mobility Resort Motegi", country: "Japan", countryIt: "Giappone", countryCode: "JP", date: "2026-10-04", trackImage: "/tracks/japan.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/jpn/motogp/rac/classification" },
  { round: 18, name: "Grand Prix of Indonesia", nameIt: "Gran Premio di Indonesia", circuit: "Pertamina Mandalika Circuit", circuitIt: "Circuito Pertamina Mandalika", country: "Indonesia", countryIt: "Indonesia", countryCode: "ID", date: "2026-10-11", trackImage: "/tracks/indonesia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ina/motogp/rac/classification" },
  { round: 19, name: "Grand Prix of Australia", nameIt: "Gran Premio d'Australia", circuit: "Phillip Island Grand Prix Circuit", circuitIt: "Circuito di Phillip Island", country: "Australia", countryIt: "Australia", countryCode: "AU", date: "2026-10-25", trackImage: "/tracks/australia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/aus/motogp/rac/classification" },
  { round: 20, name: "Grand Prix of Malaysia", nameIt: "Gran Premio della Malesia", circuit: "Sepang International Circuit", circuitIt: "Circuito Internazionale di Sepang", country: "Malaysia", countryIt: "Malesia", countryCode: "MY", date: "2026-11-01", trackImage: "/tracks/malaysia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/mal/motogp/rac/classification" },
  { round: 21, name: "Grand Prix of Portugal", nameIt: "Gran Premio del Portogallo", circuit: "Autódromo Internacional do Algarve", circuitIt: "Autodromo Internazionale dell'Algarve", country: "Portugal", countryIt: "Portogallo", countryCode: "PT", date: "2026-11-15", trackImage: "/tracks/portugal.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/por/motogp/rac/classification" },
  { round: 22, name: "Grand Prix of Valencia", nameIt: "Gran Premio di Valencia", circuit: "Circuit Ricardo Tormo", circuitIt: "Circuito Ricardo Tormo", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-11-22", trackImage: "/tracks/valencia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/val/motogp/rac/classification" },
];

const updateStmt = sqlite.prepare(`
  UPDATE races SET
    name = ?,
    name_it = ?,
    circuit = ?,
    circuit_it = ?,
    country = ?,
    country_it = ?,
    country_code = ?,
    date = ?,
    track_image = ?,
    official_results_url = ?
  WHERE round = ? AND season = 2026
`);

console.log("Updating 2026 calendar...");

const updateAll = sqlite.transaction(() => {
  for (const race of updatedCalendar) {
    const result = updateStmt.run(
      race.name,
      race.nameIt,
      race.circuit,
      race.circuitIt,
      race.country,
      race.countryIt,
      race.countryCode,
      race.date,
      race.trackImage,
      race.officialResultsUrl,
      race.round,
    );
    if (result.changes > 0) {
      console.log(`  Round ${race.round}: ${race.name} - updated`);
    } else {
      console.log(`  Round ${race.round}: ${race.name} - no row found (skipped)`);
    }
  }
});

updateAll();

console.log("Calendar update completed.");
sqlite.close();
process.exit(0);
