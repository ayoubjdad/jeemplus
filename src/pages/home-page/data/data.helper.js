export const PINNED_LEAGUES = [
  { id: 47, name: "Premier League" },
  { id: 87, name: "LaLiga" },
  { id: 54, name: "Bundesliga" },
  { id: 53, name: "Ligue 1" },
  { id: 246, name: "Serie A" },
  { id: 42, name: "Champions League" },
  { id: 73, name: "Europa League" },
];

export const PINNED_LEAGUE_IDS = new Set(
  PINNED_LEAGUES.map((league) => league.id),
);

export const LEAGUES = [
  { id: 530, name: "Botola Pro" },
  ...PINNED_LEAGUES,
  { id: 77, name: "World Cup" },
  { id: 526, name: "CAF Champions League" },
  { id: 525, name: "AFC Champions League Elite" },
  { id: 289, name: "Africa Cup of Nations" },
  { id: 10608, name: "Africa Cup of Nations Qualification" },
  { id: 9428, name: "African Nations Championship" },
  { id: 10508, name: "African Football League" },
  { id: 10474, name: "Arab Club Champions Cup" },
  { id: 11156, name: "Arab Cup Qualification" },
  { id: 10619, name: "CAF Champions League Qualification" },
  { id: 9467, name: "CAF Super Cup" },
  { id: 9468, name: "CAF Confed Cup" },
  { id: 10611, name: "Champions League Qualification" },
  { id: 11011, name: "CAF Women's Champions League" },
  { id: 10216, name: "Conference League" },
  { id: 10242, name: "FIFA Arab Cup" },
  { id: 78, name: "FIFA Club World Cup" },
  { id: 10369, name: "Women's World Cup U20" },
  { id: 66, name: "Summer Olympics" },
  { id: 74, name: "UEFA Super Cup" },
  { id: 9806, name: "UEFA Nations League A" },
  { id: 138, name: "Copa del Rey" },
  { id: 10703, name: "FIFA Intercontinental Cup" },
];



export const LEAGUE_IDS = new Set(LEAGUES.map((league) => league.id));

export const LEAGUE_FR = {
  530: "Botola Pro",
  47: "Premier League",
  87: "LaLiga",
  54: "Bundesliga",
  53: "Ligue 1",
  246: "Serie A",
  42: "Ligue des champions",
  77: "Coupe du monde de la FIFA",
  73: "Europa League",
  526: "CAF Champions League",
  525: "AFC Champions League Elite",
  289: "Coupe d'Afrique des nations",
  10608: "Coupe d'Afrique des nations Qualification",
  9428: "Championnat d'Afrique des nations",
  10508: "African Football League",
  10474: "Coupe des clubs champions arabes",
  10619: "CAF Champions League Qualification",
  9467: "CAF Super Cup",
  9468: "Coupe de la CAF",
  10611: "Ligue des champions Qualification",
  10216: "Ligue Europa Conférence",
  78: "Coupe du monde des clubs",
  74: "Super Coupe de l'UEFA",
  9806: "Ligue des nations A",
  138: "Copa del Rey",
  10703: "Coupe intercontinentale FIFA",
};

export const FOTMOB = "/fotmob-api";
export const IMG = "https://images.fotmob.com/image_resources";

export const FOLLOWED_TEAMS = [{ id: 9847, name: "Paris Saint-Germain" }];

export const FOLLOWED_LEAGUES = [
  { id: 530, name: "Botola Pro" },
  { id: 47, name: "Premier League" },
  { id: 87, name: "LaLiga" },
  { id: 42, name: "Ligue des champions" },
  { id: 77, name: "Coupe du monde de la FIFA" },
  { id: 73, name: "Europa League" },
  { id: 526, name: "CAF Champions League" },
  { id: 525, name: "AFC Champions League Elite" },
  { id: 289, name: "Coupe d'Afrique des nations" },
  { id: 10608, name: "Coupe d'Afrique des nations Qualification" },
];

export const COUNTRY_FR = {
  ENG: "Angleterre",
  ESP: "Espagne",
  GER: "Allemagne",
  FRA: "France",
  ITA: "Italie",
  POR: "Portugal",
  NED: "Pays-Bas",
  BEL: "Belgique",
  SUI: "Suisse",
  AUT: "Autriche",
  TUR: "Turquie",
  GRE: "Grèce",
  SCO: "Écosse",
  WAL: "Pays de Galles",
  IRL: "Irlande",
  MAR: "Maroc",
  ALG: "Algérie",
  TUN: "Tunisie",
  EGY: "Égypte",
  SEN: "Sénégal",
  CIV: "Côte d'Ivoire",
  RSA: "Afrique du Sud",
  NGA: "Nigeria",
  GHA: "Ghana",
  CMR: "Cameroun",
  USA: "États-Unis",
  MEX: "Mexique",
  BRA: "Brésil",
  ARG: "Argentine",
  URU: "Uruguay",
  CHI: "Chili",
  COL: "Colombie",
  ECU: "Équateur",
  JPN: "Japon",
  KOR: "Corée du Sud",
  CHN: "Chine",
  AUS: "Australie",
  KSA: "Arabie saoudite",
  UAE: "Émirats",
  QAT: "Qatar",
  EUR: "Europe",
  INT: "International",
  AFR: "Afrique",
  CAF: "Afrique",
  ASI: "Asie",
  CON: "Amérique du Sud",
  FIFA: "FIFA",
  UEFA: "Europe",
};

export const INTL_CODES = new Set([
  "INT",
  "EUR",
  "AFR",
  "ASI",
  "CON",
  "FIFA",
  "UEFA",
  "CAF",
]);

export const FALLBACK_TRANSFERS = [
  {
    playerId: 737066,
    name: "Gabriel Martinelli",
    fromId: 9825,
    toId: 52695,
    fee: "70 M€",
  },
  {
    playerId: 961351,
    name: "Enzo Fernández",
    fromId: 8455,
    toId: 8456,
    fee: "145 M€",
  },
  {
    playerId: 1203709,
    name: "Bradley Barcola",
    fromId: 9847,
    toId: 8650,
    fee: "125 M€",
  },
];

const staticGamesData = [
  {
    ccode: "ENG",
    id: 47,
    primaryId: 47,
    name: "Premier League",
    matches: [
      {
        id: 5795438,
        leagueId: 47,
        time: "06.09.2026 15:00",
        home: {
          id: 8668,
          score: 0,
          name: "Everton",
          longName: "Everton",
        },
        away: {
          id: 10260,
          score: 0,
          name: "Man United",
          longName: "Manchester United",
        },
        eliminatedTeamId: null,
        statusId: 1,
        tournamentStage: "3",
        status: {
          utcTime: "2026-09-06T13:00:00.000Z",
          halfs: {
            firstHalfStarted: "06.09.2026 15:00:00",
          },
          periodLength: 45,
          started: false,
          cancelled: false,
          finished: false,
        },
        timeTS: 1788699600000,
      },
      {
        id: 5795435,
        leagueId: 47,
        time: "06.09.2026 17:30",
        home: {
          id: 9825,
          score: 0,
          name: "Arsenal",
          longName: "Arsenal",
        },
        away: {
          id: 8455,
          score: 0,
          name: "Chelsea",
          longName: "Chelsea",
        },
        eliminatedTeamId: null,
        statusId: 1,
        tournamentStage: "3",
        status: {
          utcTime: "2026-09-06T15:30:00.000Z",
          halfs: {
            firstHalfStarted: "06.09.2026 17:30:00",
          },
          periodLength: 45,
          started: false,
          cancelled: false,
          finished: false,
        },
        timeTS: 1788708600000,
      },
    ],
    internalRank: 30,
    simpleLeague: false,
    localRank: 24,
  },
];
