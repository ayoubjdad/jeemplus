import { describe, it, expect } from "vitest";
import { mapFixture, mapFixtureStatus, mapFixtures } from "../mapFixture.js";
import { mapStandingRow } from "../mapStandingRow.js";
import { mapTeam } from "../mapTeam.js";

describe("mapFixtureStatus", () => {
  it("maps live status", () => {
    expect(mapFixtureStatus({ short: "1H", long: "First Half" }).type).toBe(
      "inprogress",
    );
  });

  it("maps finished status", () => {
    expect(mapFixtureStatus({ short: "FT", long: "Match Finished" }).type).toBe(
      "finished",
    );
  });
});

describe("mapFixture", () => {
  it("maps API fixture to app model", () => {
    const result = mapFixture({
      fixture: {
        id: 123,
        timestamp: 1700000000,
        status: { short: "NS", long: "Not Started" },
        venue: { name: "Stade", city: "Casablanca" },
      },
      league: { id: 200, name: "Botola Pro", country: "Morocco", season: 2025, round: "Regular Season - 1" },
      teams: {
        home: { id: 1, name: "Wydad", logo: "https://example.com/w.png", winner: null },
        away: { id: 2, name: "Raja", logo: "https://example.com/r.png", winner: null },
      },
      goals: { home: null, away: null },
      score: { halftime: { home: null, away: null } },
    });

    expect(result.id).toBe(123);
    expect(result.homeTeam.name).toBe("Wydad");
    expect(result.league.id).toBe(200);
    expect(result.status.type).toBe("notstarted");
  });
});

describe("mapFixtures", () => {
  it("excludes fixtures involving Israel", () => {
    const items = [
      {
        fixture: { id: 1, timestamp: 1, status: { short: "NS", long: "Not Started" } },
        league: { id: 10, name: "Friendlies", country: "World", season: 2026 },
        teams: {
          home: { id: 100, name: "Albania", logo: "" },
          away: { id: 1110, name: "Israel", logo: "" },
        },
        goals: { home: null, away: null },
        score: {},
      },
      {
        fixture: { id: 2, timestamp: 2, status: { short: "NS", long: "Not Started" } },
        league: { id: 200, name: "Botola Pro", country: "Morocco", season: 2025 },
        teams: {
          home: { id: 1, name: "Wydad", logo: "" },
          away: { id: 2, name: "Raja", logo: "" },
        },
        goals: { home: null, away: null },
        score: {},
      },
    ];

    const result = mapFixtures(items);
    expect(result).toHaveLength(1);
    expect(result[0].homeTeam.name).toBe("Wydad");
  });
});

describe("mapStandingRow", () => {
  it("maps standing row with goal diff", () => {
    const row = mapStandingRow({
      rank: 1,
      points: 30,
      goalsDiff: 10,
      all: { played: 10, win: 9, draw: 1, lose: 0, goals: { for: 20, against: 10 } },
      team: { id: 1, name: "Wydad", logo: "https://example.com/w.png" },
      description: "Promotion",
    });

    expect(row.position).toBe(1);
    expect(row.points).toBe(30);
    expect(row.scoreDiffFormatted).toBe("+10");
    expect(row.team.name).toBe("Wydad");
  });
});

describe("mapTeam", () => {
  it("includes logo URL", () => {
    const team = mapTeam({ id: 5, name: "Test FC", logo: "https://logo.png", country: "Morocco" });
    expect(team.logo).toBe("https://logo.png");
  });
});
