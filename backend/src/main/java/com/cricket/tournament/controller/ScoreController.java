package com.cricket.tournament.controller;

import com.cricket.tournament.model.Score;
import com.cricket.tournament.service.ScoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @PostMapping
    public ResponseEntity<Score> createScore(@Valid @RequestBody Score score) {
        Score createdScore = scoreService.createScore(score);
        return new ResponseEntity<>(createdScore, HttpStatus.CREATED);
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<Score> getScoreByMatchId(@PathVariable Long matchId) {
        Optional<Score> scoreOpt = scoreService.getScoreByMatchId(matchId);
        return scoreOpt.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
