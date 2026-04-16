package com.cricket.tournament.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private static final Logger logger = LoggerFactory.getLogger(PublicController.class);

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            logger.info("[PING] Received ping request");
            return ResponseEntity.ok(Map.of("status", "pong", "timestamp", java.time.LocalDateTime.now().toString()));
        } catch (Exception e) {
            logger.error("[PING ERROR] Exception in ping: ", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
