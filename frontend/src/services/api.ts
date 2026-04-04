import axios from 'axios';
import type { Team, Match, Score, PointsTableEntry, Player, LiveMatchSetupDto, BallSubmissionDto, LiveMatchDetailsDto, ScorecardBatting, ScorecardBowling, PlayerProfileDto } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
console.log("API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const AuthService = {
  login: (username: string, password: string) => api.post<{ token: string }>('/auth/login', { username, password }),
};

export const TeamService = {
  getAllTeams: () => api.get<Team[]>('/teams'),
  getTeamById: (id: number) => api.get<Team>(`/teams/${id}`),
  createTeam: (team: Team) => api.post<Team>('/teams', team),
  updateTeam: (id: number, team: Team) => api.put<Team>(`/teams/${id}`, team),
  deleteTeam: (id: number) => api.delete(`/teams/${id}`),
  assignPlayers: (id: number, playerIds: number[]) => api.post<Team>(`/teams/${id}/players`, playerIds),
};

export const PlayerService = {
  getAllPlayers: () => api.get<Player[]>('/players'),
  getPlayerById: (id: number) => api.get<PlayerProfileDto>(`/players/${id}`),
  updatePlayer: (id: number, player: Player) => api.put<Player>(`/players/${id}`, player),
  addPlayer: (player: Player) => api.post<Player>('/players', player),
  getPlayersByTeam: (teamId: number) => api.get<Player[]>(`/players/team/${teamId}`),
  removePlayer: (id: number) => api.delete(`/players/${id}`),
};

export const MatchService = {
  getAllMatches: () => api.get<Match[]>('/matches'),
  getMatchById: (id: number) => api.get<Match>(`/matches/${id}`),
  scheduleMatch: (match: Match) => api.post<Match>('/matches', match),
  updateMatchStatus: (id: number, status: string) => api.patch<Match>(`/matches/${id}/status`, { status }),
  deleteMatch: (id: number) => api.delete(`/matches/${id}`),
};

export const ScoreService = {
  getScoreByMatchId: (matchId: number) => api.get<Score>(`/scores/match/${matchId}`),
  recordScore: (score: Score) => api.post<Score>('/scores', score),
};

export const PointsService = {
  getPointsTable: () => api.get<Record<'TOURNAMENT' | 'PRACTICE', PointsTableEntry[]>>('/points'),
  getTopPerformers: () => api.get<{ TOURNAMENT: { topRunScorers: any[], topWicketTakers: any[] }, PRACTICE: { topRunScorers: any[], topWicketTakers: any[] } }>('/points/top-performers'),
};

export const MatchScoringService = {
  getLiveMatches: () => api.get<Match[]>('/scoring/live'),
  getLiveDetails: (matchId: number) => api.get<LiveMatchDetailsDto>(`/scoring/${matchId}/live-details`),
  getCompleteScorecard: (matchId: number) => api.get<{ match: Match, batting: ScorecardBatting[], bowling: ScorecardBowling[] }>(`/scoring/${matchId}/scorecard`),
  startLiveScoring: (matchId: number, setup: LiveMatchSetupDto) => api.post<Match>(`/scoring/${matchId}/setup`, setup),
  recordBall: (matchId: number, ballDto: BallSubmissionDto) => api.post<Match>(`/scoring/${matchId}/ball`, ballDto),
  undoLastBall: (matchId: number) => api.delete<Match>(`/scoring/${matchId}/last-ball`),
  updateBowler: (matchId: number, bowlerId: number) => api.patch<Match>(`/scoring/${matchId}/bowler?bowlerId=${bowlerId}`),
  swapBatsmen: (matchId: number) => api.post<Match>(`/scoring/${matchId}/swap-batsmen`),
  endInnings: (matchId: number, params: { strikerId: number, nonStrikerId: number, bowlerId: number, targetScore: number }) =>
    api.post<Match>(`/scoring/${matchId}/end-innings`, null, { params }),
  completeMatch: (matchId: number, winnerTeamId?: number, manOfTheMatchId?: number) =>
    api.post<Match>(`/scoring/${matchId}/complete`, null, { params: { winnerTeamId, manOfTheMatchId } }),
};

export const UploadService = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const GalleryService = {
  getAllImages: () => api.get<any[]>('/gallery'),
  addImage: (data: { imageUrl: string }) => api.post<any>('/gallery', data),
  deleteImage: (id: number) => api.delete(`/gallery/${id}`)
};

export default api;
