package com.cricket.tournament.controller;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.service.MatchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @GetMapping
    public List<Match> getAllMatches() {
        return matchService.getAllMatches();
    }

    @PostMapping
    public ResponseEntity<Match> createMatch(@Valid @RequestBody Match match) {
        Match createdMatch = matchService.createMatch(match);
        return new ResponseEntity<>(createdMatch, HttpStatus.CREATED);
    }

    @GetMapping("/upcoming")
    public List<Match> getUpcomingMatches() {
        return matchService.getUpcomingMatches();
    }

    @GetMapping("/completed")
    public List<Match> getCompletedMatches() {
        return matchService.getCompletedMatches();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getMatchById(@PathVariable Long id) {
        Match match = matchService.getMatchById(id);
        return new ResponseEntity<>(match, HttpStatus.OK);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Match> updateMatchStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        Match match = matchService.getMatchById(id);
        Match.MatchStatus newStatus = Match.MatchStatus.valueOf(payload.get("status"));
        match.setStatus(newStatus);
        Match updatedMatch = matchService.saveMatch(match);
        return new ResponseEntity<>(updatedMatch, HttpStatus.OK);
    }
}
