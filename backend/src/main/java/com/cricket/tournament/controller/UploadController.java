package com.cricket.tournament.controller;

import com.cricket.tournament.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("image") MultipartFile file) {
        try {
            // Basic validation
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty."));
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
            }
            
            // Cloudinary limits depend on plan, no need for hardcoded arbitrary limit block 
            // but we can limit to e.g. 5MB here for basic safety
            if (file.getSize() > 5 * 1024 * 1024) {
                 return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of("error", "File too large. Maximum size is 5MB."));
            }

            String url = cloudinaryService.uploadFile(file);
            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not upload image: " + e.getMessage()));
        }
    }
}
