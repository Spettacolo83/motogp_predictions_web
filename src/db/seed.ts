import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "./sqlite.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  db.delete(schema.scores).run();
  db.delete(schema.raceResults).run();
  db.delete(schema.predictions).run();
  db.delete(schema.riders).run();
  db.delete(schema.teams).run();
  db.delete(schema.races).run();
  db.delete(schema.invitationCodes).run();

  // === INVITATION CODES ===
  db.insert(schema.invitationCodes)
    .values([
      { code: "motogp_2026", maxUses: 50, currentUses: 0 },
      { code: "vip_2026", maxUses: 10, currentUses: 0 },
    ])
    .run();
  console.log("Invitation codes created");

  // === TEAMS ===
  const teamsData = [
    { id: "ducati-factory", name: "Ducati Lenovo", fullName: "Ducati Lenovo Team", manufacturer: "Ducati" as const, color: "#CC0000", isFactory: true },
    { id: "gresini", name: "Gresini Racing", fullName: "Gresini Racing MotoGP", manufacturer: "Ducati" as const, color: "#009246", isFactory: false },
    { id: "vr46", name: "VR46 Racing", fullName: "Pertamina Enduro VR46 Racing Team", manufacturer: "Ducati" as const, color: "#FFDD00", isFactory: false },
    { id: "aprilia-factory", name: "Aprilia Racing", fullName: "Aprilia Racing", manufacturer: "Aprilia" as const, color: "#41424C", isFactory: true },
    { id: "trackhouse", name: "Trackhouse Racing", fullName: "Trackhouse Racing", manufacturer: "Aprilia" as const, color: "#7B2D8B", isFactory: false },
    { id: "ktm-factory", name: "Red Bull KTM", fullName: "Red Bull KTM Factory Racing", manufacturer: "KTM" as const, color: "#FF6600", isFactory: true },
    { id: "ktm-tech3", name: "KTM Tech3", fullName: "Red Bull KTM Tech3", manufacturer: "KTM" as const, color: "#0033A0", isFactory: false },
    { id: "yamaha-factory", name: "Monster Yamaha", fullName: "Monster Energy Yamaha MotoGP", manufacturer: "Yamaha" as const, color: "#0D47A1", isFactory: true },
    { id: "pramac-yamaha", name: "Pramac Yamaha", fullName: "Prima Pramac Yamaha", manufacturer: "Yamaha" as const, color: "#6A0DAD", isFactory: false },
    { id: "honda-factory", name: "Repsol Honda", fullName: "Repsol Honda HRC", manufacturer: "Honda" as const, color: "#FF8C00", isFactory: true },
    { id: "honda-lcr", name: "LCR Honda", fullName: "Idemitsu Honda LCR", manufacturer: "Honda" as const, color: "#228B22", isFactory: false },
  ];

  db.insert(schema.teams).values(teamsData).run();
  console.log("Teams created");

  // === RIDERS ===
  const ridersData = [
    // Ducati Lenovo
    { id: "bagnaia", number: 63, firstName: "Francesco", lastName: "Bagnaia", teamId: "ducati-factory", nationality: "IT", imageUrl: "/riders/bagnaia.png" },
    { id: "marc-marquez", number: 93, firstName: "Marc", lastName: "Marquez", teamId: "ducati-factory", nationality: "ES", imageUrl: "/riders/marc-marquez.png" },
    // Gresini Racing
    { id: "alex-marquez", number: 73, firstName: "Alex", lastName: "Marquez", teamId: "gresini", nationality: "ES", imageUrl: "/riders/alex-marquez.png" },
    { id: "aldeguer", number: 54, firstName: "Fermin", lastName: "Aldeguer", teamId: "gresini", nationality: "ES", imageUrl: "/riders/aldeguer.png" },
    // VR46
    { id: "diggia", number: 49, firstName: "Fabio", lastName: "Di Giannantonio", teamId: "vr46", nationality: "IT", imageUrl: "/riders/diggia.png" },
    { id: "morbidelli", number: 21, firstName: "Franco", lastName: "Morbidelli", teamId: "vr46", nationality: "IT", imageUrl: "/riders/morbidelli.png" },
    // Aprilia Racing
    { id: "martin", number: 1, firstName: "Jorge", lastName: "Martin", teamId: "aprilia-factory", nationality: "ES", imageUrl: "/riders/martin.png" },
    { id: "bezzecchi", number: 72, firstName: "Marco", lastName: "Bezzecchi", teamId: "aprilia-factory", nationality: "IT", imageUrl: "/riders/bezzecchi.png" },
    // Trackhouse
    { id: "raul-fernandez", number: 25, firstName: "Raul", lastName: "Fernandez", teamId: "trackhouse", nationality: "ES", imageUrl: "/riders/raul-fernandez.png" },
    { id: "ogura", number: 79, firstName: "Ai", lastName: "Ogura", teamId: "trackhouse", nationality: "JP", imageUrl: "/riders/ogura.png" },
    // KTM Factory
    { id: "acosta", number: 37, firstName: "Pedro", lastName: "Acosta", teamId: "ktm-factory", nationality: "ES", imageUrl: "/riders/acosta.png" },
    { id: "binder", number: 33, firstName: "Brad", lastName: "Binder", teamId: "ktm-factory", nationality: "ZA", imageUrl: "/riders/binder.png" },
    // KTM Tech3
    { id: "vinales", number: 12, firstName: "Maverick", lastName: "Vinales", teamId: "ktm-tech3", nationality: "ES", imageUrl: "/riders/vinales.png" },
    { id: "bastianini", number: 23, firstName: "Enea", lastName: "Bastianini", teamId: "ktm-tech3", nationality: "IT", imageUrl: "/riders/bastianini.png" },
    // Yamaha Factory
    { id: "quartararo", number: 20, firstName: "Fabio", lastName: "Quartararo", teamId: "yamaha-factory", nationality: "FR", imageUrl: "/riders/quartararo.png" },
    { id: "rins", number: 42, firstName: "Alex", lastName: "Rins", teamId: "yamaha-factory", nationality: "ES", imageUrl: "/riders/rins.png" },
    // Pramac Yamaha
    { id: "razgatlioglu", number: 7, firstName: "Toprak", lastName: "Razgatlioglu", teamId: "pramac-yamaha", nationality: "TR", imageUrl: "/riders/razgatlioglu.png" },
    { id: "miller", number: 43, firstName: "Jack", lastName: "Miller", teamId: "pramac-yamaha", nationality: "AU", imageUrl: "/riders/miller.png" },
    // Repsol Honda
    { id: "mir", number: 36, firstName: "Joan", lastName: "Mir", teamId: "honda-factory", nationality: "ES", imageUrl: "/riders/mir.png" },
    { id: "marini", number: 10, firstName: "Luca", lastName: "Marini", teamId: "honda-factory", nationality: "IT", imageUrl: "/riders/marini.png" },
    // LCR Honda
    { id: "zarco", number: 5, firstName: "Johann", lastName: "Zarco", teamId: "honda-lcr", nationality: "FR", imageUrl: "/riders/zarco.png" },
    { id: "moreira", number: 11, firstName: "Diogo", lastName: "Moreira", teamId: "honda-lcr", nationality: "BR", imageUrl: "/riders/moreira.png" },
  ];

  db.insert(schema.riders).values(ridersData).run();
  console.log("Riders created");

  // === RACES (MotoGP 2026 Calendar) ===
  const racesData = [
    { round: 1, name: "Grand Prix of Thailand", nameIt: "Gran Premio della Thailandia", circuit: "Chang International Circuit", circuitIt: "Circuito Internazionale di Chang", country: "Thailand", countryIt: "Thailandia", countryCode: "TH", date: "2026-03-01", trackImage: "/tracks/thailand.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/tha/motogp/rac/classification" },
    { round: 2, name: "Grand Prix of Argentina", nameIt: "Gran Premio di Argentina", circuit: "Termas de Rio Hondo", circuitIt: "Termas de Rio Hondo", country: "Argentina", countryIt: "Argentina", countryCode: "AR", date: "2026-03-15", trackImage: "/tracks/argentina.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/arg/motogp/rac/classification" },
    { round: 3, name: "Grand Prix of the Americas", nameIt: "Gran Premio delle Americhe", circuit: "Circuit of the Americas", circuitIt: "Circuito delle Americhe", country: "United States", countryIt: "Stati Uniti", countryCode: "US", date: "2026-03-29", trackImage: "/tracks/americas.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ame/motogp/rac/classification" },
    { round: 4, name: "Grand Prix of Qatar", nameIt: "Gran Premio del Qatar", circuit: "Lusail International Circuit", circuitIt: "Circuito Internazionale di Lusail", country: "Qatar", countryIt: "Qatar", countryCode: "QA", date: "2026-04-12", trackImage: "/tracks/qatar.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/qat/motogp/rac/classification" },
    { round: 5, name: "Grand Prix of Spain", nameIt: "Gran Premio di Spagna", circuit: "Circuito de Jerez", circuitIt: "Circuito di Jerez", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-04-26", trackImage: "/tracks/spain-jerez.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/spa/motogp/rac/classification" },
    { round: 6, name: "Grand Prix of France", nameIt: "Gran Premio di Francia", circuit: "Le Mans", circuitIt: "Le Mans", country: "France", countryIt: "Francia", countryCode: "FR", date: "2026-05-10", trackImage: "/tracks/france.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/fra/motogp/rac/classification" },
    { round: 7, name: "Grand Prix of Great Britain", nameIt: "Gran Premio di Gran Bretagna", circuit: "Silverstone Circuit", circuitIt: "Circuito di Silverstone", country: "Great Britain", countryIt: "Gran Bretagna", countryCode: "GB", date: "2026-05-24", trackImage: "/tracks/great-britain.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/gbr/motogp/rac/classification" },
    { round: 8, name: "Grand Prix of Aragon", nameIt: "Gran Premio di Aragona", circuit: "MotorLand Aragon", circuitIt: "MotorLand Aragona", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-06-07", trackImage: "/tracks/aragon.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ara/motogp/rac/classification" },
    { round: 9, name: "Grand Prix of Italy", nameIt: "Gran Premio d'Italia", circuit: "Autodromo del Mugello", circuitIt: "Autodromo del Mugello", country: "Italy", countryIt: "Italia", countryCode: "IT", date: "2026-06-14", trackImage: "/tracks/italy-mugello.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ita/motogp/rac/classification" },
    { round: 10, name: "Grand Prix of the Netherlands", nameIt: "Gran Premio dei Paesi Bassi", circuit: "TT Circuit Assen", circuitIt: "TT Circuit Assen", country: "Netherlands", countryIt: "Paesi Bassi", countryCode: "NL", date: "2026-06-28", trackImage: "/tracks/netherlands.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ned/motogp/rac/classification" },
    { round: 11, name: "Grand Prix of Germany", nameIt: "Gran Premio di Germania", circuit: "Sachsenring", circuitIt: "Sachsenring", country: "Germany", countryIt: "Germania", countryCode: "DE", date: "2026-07-12", trackImage: "/tracks/germany.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ger/motogp/rac/classification" },
    { round: 12, name: "Grand Prix of Czech Republic", nameIt: "Gran Premio della Repubblica Ceca", circuit: "Automotodrom Brno", circuitIt: "Automotodrom Brno", country: "Czech Republic", countryIt: "Repubblica Ceca", countryCode: "CZ", date: "2026-07-19", trackImage: "/tracks/czech-republic.png", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/cze/motogp/rac/classification" },
    { round: 13, name: "Grand Prix of Austria", nameIt: "Gran Premio d'Austria", circuit: "Red Bull Ring", circuitIt: "Red Bull Ring", country: "Austria", countryIt: "Austria", countryCode: "AT", date: "2026-08-09", trackImage: "/tracks/austria.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/aut/motogp/rac/classification" },
    { round: 14, name: "Grand Prix of Catalonia", nameIt: "Gran Premio di Catalogna", circuit: "Circuit de Barcelona-Catalunya", circuitIt: "Circuito di Barcellona-Catalogna", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-09-06", trackImage: "/tracks/catalonia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/cat/motogp/rac/classification" },
    { round: 15, name: "Grand Prix of San Marino", nameIt: "Gran Premio di San Marino", circuit: "Misano World Circuit", circuitIt: "Misano World Circuit", country: "San Marino", countryIt: "San Marino", countryCode: "SM", date: "2026-09-13", trackImage: "/tracks/san-marino.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/smr/motogp/rac/classification" },
    { round: 16, name: "Grand Prix of Kazakhstan", nameIt: "Gran Premio del Kazakistan", circuit: "Sokol International Racetrack", circuitIt: "Sokol International Racetrack", country: "Kazakhstan", countryIt: "Kazakistan", countryCode: "KZ", date: "2026-09-27", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/kaz/motogp/rac/classification" },
    { round: 17, name: "Grand Prix of Japan", nameIt: "Gran Premio del Giappone", circuit: "Twin Ring Motegi", circuitIt: "Twin Ring Motegi", country: "Japan", countryIt: "Giappone", countryCode: "JP", date: "2026-10-04", trackImage: "/tracks/japan.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/jpn/motogp/rac/classification" },
    { round: 18, name: "Grand Prix of Indonesia", nameIt: "Gran Premio di Indonesia", circuit: "Mandalika International Street Circuit", circuitIt: "Circuito Internazionale Mandalika", country: "Indonesia", countryIt: "Indonesia", countryCode: "ID", date: "2026-10-18", trackImage: "/tracks/indonesia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/ina/motogp/rac/classification" },
    { round: 19, name: "Grand Prix of Australia", nameIt: "Gran Premio d'Australia", circuit: "Phillip Island Grand Prix Circuit", circuitIt: "Circuito di Phillip Island", country: "Australia", countryIt: "Australia", countryCode: "AU", date: "2026-10-25", trackImage: "/tracks/australia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/aus/motogp/rac/classification" },
    { round: 20, name: "Grand Prix of Malaysia", nameIt: "Gran Premio della Malesia", circuit: "Sepang International Circuit", circuitIt: "Circuito Internazionale di Sepang", country: "Malaysia", countryIt: "Malesia", countryCode: "MY", date: "2026-11-01", trackImage: "/tracks/malaysia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/mal/motogp/rac/classification" },
    { round: 21, name: "Grand Prix of Portugal", nameIt: "Gran Premio del Portogallo", circuit: "Autodromo Internacional do Algarve", circuitIt: "Autodromo Internazionale dell'Algarve", country: "Portugal", countryIt: "Portogallo", countryCode: "PT", date: "2026-11-08", trackImage: "/tracks/portugal.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/por/motogp/rac/classification" },
    { round: 22, name: "Grand Prix of Valencia", nameIt: "Gran Premio di Valencia", circuit: "Circuit Ricardo Tormo", circuitIt: "Circuito Ricardo Tormo", country: "Spain", countryIt: "Spagna", countryCode: "ES", date: "2026-11-22", trackImage: "/tracks/valencia.svg", officialResultsUrl: "https://www.motogp.com/en/gp-results/2026/val/motogp/rac/classification" },
  ];

  db.insert(schema.races).values(racesData).run();
  console.log("Races created");

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
