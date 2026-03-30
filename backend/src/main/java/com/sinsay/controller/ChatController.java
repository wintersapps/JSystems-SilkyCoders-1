package com.sinsay.controller;

import com.sinsay.model.ChatMessage;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import com.sinsay.service.ChatService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SessionRepository sessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @PostMapping(value = "/{id}/messages", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<?> postMessage(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            HttpServletResponse response) {

        // 1. Load session
        Session session = sessionRepository.findById(id)
                .orElse(null);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        // 2. Extract messages array from body
        Object messagesObj = body.get("messages");
        if (!(messagesObj instanceof List<?> messagesList) || messagesList.isEmpty()) {
            return ResponseEntity.badRequest().body("messages array is required and must not be empty");
        }

        // 3. Extract text from last message: messages[last].content[0].text
        String userText = extractLastMessageText(messagesList);
        if (userText == null || userText.isBlank()) {
            return ResponseEntity.badRequest().body("could not extract text from last message");
        }

        // 4. Load history from DB
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdOrderBySequenceNumberAsc(id);

        // 5. Set Vercel AI stream header directly on response (before emitter starts)
        response.setHeader("X-Vercel-AI-Data-Stream", "v1");

        // 6. Create emitter and delegate to ChatService
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();
        chatService.streamResponse(session, history, userText, emitter);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(emitter);
    }

    @SuppressWarnings("unchecked")
    private String extractLastMessageText(List<?> messages) {
        Object last = messages.get(messages.size() - 1);
        if (!(last instanceof Map<?, ?> lastMsg)) {
            return null;
        }
        Object contentObj = lastMsg.get("content");
        if (!(contentObj instanceof List<?> contentList) || contentList.isEmpty()) {
            return null;
        }
        Object firstPart = contentList.get(0);
        if (!(firstPart instanceof Map<?, ?> part)) {
            return null;
        }
        Object text = part.get("text");
        return text instanceof String s ? s : null;
    }
}
