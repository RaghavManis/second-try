package com.cricket.tournament.controller;

import com.cricket.tournament.dto.ContactRequestDto;
import com.cricket.tournament.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<?> submitContactForm(@RequestBody ContactRequestDto request) {
        try {
            emailService.sendContactEmail(request.getName(), request.getEmail(), request.getMessage());
            return ResponseEntity.ok(Map.of("message", "Your message has been sent successfully!"));
        } catch (Exception e) {
            // Log the error (in a real app) and return failure
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to send message: " + e.getMessage()));
        }
    }
}
