package com.cricket.tournament.controller;

import com.cricket.tournament.model.GalleryImage;
import com.cricket.tournament.repository.GalleryImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    @Autowired
    private GalleryImageRepository galleryImageRepository;

    @GetMapping
    public List<GalleryImage> getAllImages() {
        return galleryImageRepository.findAll(Sort.by(Sort.Direction.DESC, "uploadedAt"));
    }

    @PostMapping
    public GalleryImage addImage(@RequestBody GalleryImage galleryImage) {
        return galleryImageRepository.save(galleryImage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteImage(@PathVariable Long id) {
        return galleryImageRepository.findById(id).map(img -> {
            galleryImageRepository.delete(img);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
