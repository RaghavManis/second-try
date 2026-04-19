export interface Team {
  id?: number;
  teamType?: 'TOURNAMENT' | 'PRACTICE';
  teamName: string;
  teamLogo?: string;
  coachName: string;
  players?: Player[];
}

export type PlayerRole = 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKETKEEPER';

export interface Player {
  id?: number;
  name: string;
  role: PlayerRole;
  jerseyNumber?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  
  // Basic Info
  playerImage?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

export interface PlayerProfileDto {
  player: Player;
  overallStats: any;
  tournamentStats: any;
  practiceStats: any;
}

export interface Match {
  id?: number;
  matchType?: 'TOURNAMENT' | 'PRACTICE';
  teamA: Team;
  teamB: Team;
  matchDateTime: string;
  matchEndTime?: string;
  overs: number;

  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
  winnerTeam?: Team;
  
  tossWinner?: Team;
  tossDecision?: string; // BATTING or BOWLING
  battingTeam?: Team;
  bowlingTeam?: Team;
  currentInnings?: number;
  targetScore?: number;
  currentStriker?: Player;
  currentNonStriker?: Player;
  currentBowler?: Player;
  playingXiTeamA?: Player[];
  playingXiTeamB?: Player[];
  result?: string;
  manOfTheMatch?: Player;
  streamUrl?: string;
  streamDelaySeconds?: number;
  currentScore?: number;
  currentWickets?: number;
  firstInningsScore?: number;
  firstInningsWickets?: number;
  firstInningsBalls?: number;
  currentBalls?: number;
}

export interface LiveMatchSetupDto {
  tossWinnerId: number;
  tossDecision: string;
  strikerId: number;
  nonStrikerId: number;
  openingBowlerId: number;
  totalOvers: number;
  playingXiTeamAIds?: number[];
  playingXiTeamBIds?: number[];
}

export interface BallSubmissionDto {
  runs: number;
  extraType?: string; // WIDE, NO_BALL, BYE, LEG_BYE
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string;
  playerOutId?: number;
  fielderId?: number;
  nextBatsmanId?: number;
  nextBowlerId?: number;
  crossed?: boolean;
}

export interface LiveMatchDetailsDto {
  match: Match;
  currentScore: number;
  currentWickets: number;
  currentOvers: number;
  currentRunRate: number;
  targetScore?: number;
  requiredRunRate?: number;
  currentStriker?: Player;
  currentNonStriker?: Player;
  currentBowler?: Player;
  previousBowlerId?: number;
  strikerRuns?: number;
  strikerBalls?: number;
  nonStrikerRuns?: number;
  nonStrikerBalls?: number;
  bowlerOvers?: number;
  bowlerRuns?: number;
  bowlerWickets?: number;
  recentBalls: string[];
  thisOverBalls: string[];
  
  streamUrl?: string;
  streamDelaySeconds?: number;
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
}

export interface ScorecardBatting {
  id: number;
  match: Match;
  team: Team;
  player: Player;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  howOut: string;
}

export interface ScorecardBowling {
  id: number;
  match: Match;
  team: Team;
  player: Player;
  innings: number;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economyRate: number;
}

export interface Score {
  id?: number;
  match: Match;
  teamARuns: number;
  teamAWickets: number;
  teamBRuns: number;
  teamBWickets: number;
  oversPlayed: number;
}

export interface PointsTableEntry {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  netRunRate?: number;
}

export interface GalleryImage {
  id?: number;
  imageUrl: string;
  uploadedAt?: string;
}

export interface OverDetail {
  overNumber: number;
  bowlerName: string;
  balls: string[];
  runs: number;
  wickets: number;
}

