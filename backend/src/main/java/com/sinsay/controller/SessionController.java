package com.sinsay.controller;

import com.sinsay.model.ChatMessage;
import com.sinsay.model.Intent;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import com.sinsay.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final AnalysisService analysisService;
    private final SessionRepository sessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @PostMapping
    public ResponseEntity<?> createSession(
            @RequestParam(required = false) String intent,
            @RequestParam(required = false) String orderNumber,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile image) {

        // Validate intent
        if (intent == null || intent.isBlank()) {
            return ResponseEntity.badRequest().body("intent is required");
        }
        Intent intentEnum;
        try {
            intentEnum = Intent.valueOf(intent.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("intent must be RETURN or COMPLAINT");
        }

        // Validate required text fields
        if (orderNumber == null || orderNumber.isBlank()) {
            return ResponseEntity.badRequest().body("orderNumber is required");
        }
        if (productName == null || productName.isBlank()) {
            return ResponseEntity.badRequest().body("productName is required");
        }
        if (description == null || description.isBlank()) {
            return ResponseEntity.badRequest().body("description is required");
        }

        // Validate image
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body("image is required");
        }
        if (image.getSize() > MAX_IMAGE_BYTES) {
            return ResponseEntity.badRequest().body("image must not exceed 10 MB");
        }
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body("image must be JPEG, PNG, WebP, or GIF");
        }

        AnalysisService.AnalysisResult result = analysisService.analyze(
                intentEnum, orderNumber, productName, description, image);

        return ResponseEntity.ok(Map.of(
                "sessionId", result.sessionId().toString(),
                "message", result.message()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable UUID id) {
        return sessionRepository.findById(id)
                .map(session -> {
                    List<ChatMessage> messages = chatMessageRepository
                            .findBySessionIdOrderBySequenceNumberAsc(id);
                    return ResponseEntity.ok(Map.of(
                            "session", toSessionMap(session),
                            "messages", messages.stream().map(this::toMessageMap).toList()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toSessionMap(Session s) {
        return Map.of(
                "id", s.getId() != null ? s.getId().toString() : "",
                "intent", s.getIntent().name(),
                "orderNumber", s.getOrderNumber(),
                "productName", s.getProductName(),
                "description", s.getDescription(),
                "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : "");
    }

    private Map<String, Object> toMessageMap(ChatMessage m) {
        return Map.of(
                "id", m.getId() != null ? m.getId().toString() : "",
                "role", m.getRole().name(),
                "content", m.getContent(),
                "sequenceNumber", m.getSequenceNumber());
    }
}
