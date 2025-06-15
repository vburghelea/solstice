import { describe, expect, it } from "vitest";

// Example of a simple unit test for server-side functions
describe("Server Function Example", () => {
  // Helper function to test
  function calculateLeagueStats(teams: { wins: number; losses: number }[]) {
    const totalGames = teams.reduce((sum, team) => sum + team.wins + team.losses, 0);
    const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
    const avgWinRate = teams.length > 0 ? totalWins / totalGames : 0;

    return {
      totalTeams: teams.length,
      totalGames: totalGames / 2, // Each game has 2 teams
      avgWinRate: Math.round(avgWinRate * 100) / 100,
    };
  }

  it("calculates league statistics correctly", () => {
    const teams = [
      { wins: 10, losses: 5 },
      { wins: 8, losses: 7 },
      { wins: 12, losses: 3 },
      { wins: 5, losses: 10 },
    ];

    const stats = calculateLeagueStats(teams);

    expect(stats).toEqual({
      totalTeams: 4,
      totalGames: 30, // (10+5+8+7+12+3+5+10) / 2
      avgWinRate: 0.58, // 35 wins / 60 total
    });
  });

  it("handles empty team array", () => {
    const stats = calculateLeagueStats([]);

    expect(stats).toEqual({
      totalTeams: 0,
      totalGames: 0,
      avgWinRate: 0,
    });
  });

  it("handles single team", () => {
    const teams = [{ wins: 5, losses: 3 }];
    const stats = calculateLeagueStats(teams);

    expect(stats).toEqual({
      totalTeams: 1,
      totalGames: 4, // (5+3) / 2
      avgWinRate: 0.63, // 5 / 8
    });
  });
});
