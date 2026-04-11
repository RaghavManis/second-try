package com.cricket.tournament.controller;

import com.cricket.tournament.dto.*;
import com.cricket.tournament.model.Match;
import com.cricket.tournament.service.MatchScoringService;
import com.cricket.tournament.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scoring")
public class MatchScoringController {

    @Autowired
    private MatchScoringService matchScoringService;

    @Autowired
    private MatchRepository matchRepository;

    @PostMapping("/{matchId}/setup")
    public ResponseEntity<LiveMatchDetailsDto> startLiveScoring(@PathVariable Long matchId, @RequestBody LiveMatchSetupDto setup) {
        return ResponseEntity.ok(matchScoringService.startLiveScoring(matchId, setup));
    }

    @PostMapping("/{matchId}/ball")
    public ResponseEntity<LiveMatchDetailsDto> recordBall(@PathVariable Long matchId, @RequestBody BallSubmissionDto ballDto) {
        return ResponseEntity.ok(matchScoringService.recordBall(matchId, ballDto));
    }

    @PatchMapping("/{matchId}/bowler")
    public ResponseEntity<LiveMatchDetailsDto> updateBowler(@PathVariable Long matchId, @RequestParam Long bowlerId) {
        return ResponseEntity.ok(matchScoringService.updateBowler(matchId, bowlerId));
    }

    @PostMapping("/{matchId}/swap-batsmen")
    public ResponseEntity<LiveMatchDetailsDto> swapBatsmen(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchScoringService.swapBatsmen(matchId));
    }

    @PostMapping("/{matchId}/end-innings")
    public ResponseEntity<LiveMatchDetailsDto> endInnings(@PathVariable Long matchId, @RequestParam Long strikerId, @RequestParam Long nonStrikerId, @RequestParam Long bowlerId, @RequestParam Integer targetScore) {
        return ResponseEntity.ok(matchScoringService.endInnings(matchId, strikerId, nonStrikerId, bowlerId, targetScore));
    }

    @PostMapping("/{matchId}/complete")
    public ResponseEntity<LiveMatchDetailsDto> completeMatch(@PathVariable Long matchId, @RequestParam(required = false) Long winnerTeamId, @RequestParam(required = false) Long manOfTheMatchId) {
        return ResponseEntity.ok(matchScoringService.completeMatch(matchId, winnerTeamId, manOfTheMatchId));
    }

    @DeleteMapping("/{matchId}/last-ball")
    public ResponseEntity<LiveMatchDetailsDto> undoLastBall(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchScoringService.undoLastBall(matchId));
    }

    @GetMapping("/{matchId}/live-details")
    public ResponseEntity<LiveMatchDetailsDto> getLiveDetails(@PathVariable Long matchId, @RequestParam(required = false, defaultValue = "false") boolean force) {
        return ResponseEntity.ok(matchScoringService.getLiveDetails(matchId, force));
    }

    @GetMapping("/{matchId}/scorecard")
    public ResponseEntity<java.util.Map<String, Object>> getCompleteScorecard(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchScoringService.getCompleteScorecard(matchId));
    }

    @GetMapping("/live")
    public ResponseEntity<List<Match>> getLiveMatches() {
        List<Match> ongoingMatches = matchRepository.findAll().stream()
                .filter(m -> m.getStatus() == Match.MatchStatus.ONGOING)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ongoingMatches);
    }
}
