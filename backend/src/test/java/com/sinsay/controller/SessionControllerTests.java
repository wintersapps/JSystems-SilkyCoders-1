package com.sinsay.controller;

import com.sinsay.model.Intent;
import com.sinsay.model.Session;
import com.sinsay.model.ChatMessage;
import com.sinsay.model.Role;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import com.sinsay.service.AnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SessionControllerTests {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AnalysisService analysisService;

    @MockitoBean
    SessionRepository sessionRepository;

    @MockitoBean
    ChatMessageRepository chatMessageRepository;

    // --- POST /api/sessions validation ---

    @Test
    void postSessions_missingIntent_returns400() throws Exception {
        mockMvc.perform(multipart("/api/sessions")
                        .file(new MockMultipartFile("image", "img.jpg", "image/jpeg", "x".getBytes()))
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postSessions_invalidIntent_returns400() throws Exception {
        mockMvc.perform(multipart("/api/sessions")
                        .file(new MockMultipartFile("image", "img.jpg", "image/jpeg", "x".getBytes()))
                        .param("intent", "INVALID")
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postSessions_missingImage_returns400() throws Exception {
        mockMvc.perform(multipart("/api/sessions")
                        .param("intent", "RETURN")
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isBadRequest());
    }

    @Test // TAC-BE-07
    void postSessions_oversizedImage_returns400() throws Exception {
        byte[] oversized = new byte[10 * 1024 * 1024 + 1]; // 10MB + 1 byte
        mockMvc.perform(multipart("/api/sessions")
                        .file(new MockMultipartFile("image", "big.jpg", "image/jpeg", oversized))
                        .param("intent", "RETURN")
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postSessions_invalidImageMimeType_returns400() throws Exception {
        mockMvc.perform(multipart("/api/sessions")
                        .file(new MockMultipartFile("image", "file.pdf", "application/pdf", "x".getBytes()))
                        .param("intent", "RETURN")
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postSessions_validRequest_returns200WithSessionIdAndMessage() throws Exception {
        UUID sessionId = UUID.randomUUID();
        when(analysisService.analyze(eq(Intent.RETURN), any(), any(), any(), any()))
                .thenReturn(new AnalysisService.AnalysisResult(sessionId, "AI decision"));

        mockMvc.perform(multipart("/api/sessions")
                        .file(new MockMultipartFile("image", "img.jpg", "image/jpeg", "x".getBytes()))
                        .param("intent", "RETURN")
                        .param("orderNumber", "ORD-001")
                        .param("productName", "Blue Jacket")
                        .param("description", "damaged"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
                .andExpect(jsonPath("$.message").value("AI decision"));
    }

    // --- GET /api/sessions/{id} ---

    @Test
    void getSessions_unknownId_returns404() throws Exception {
        when(sessionRepository.findById(any())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/sessions/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void getSessions_knownId_returnsSessionAndMessages() throws Exception {
        UUID id = UUID.randomUUID();
        Session session = new Session();
        session.setIntent(Intent.RETURN);
        session.setOrderNumber("ORD-001");
        session.setProductName("Blue Jacket");
        session.setDescription("damaged");

        ChatMessage msg = new ChatMessage();
        msg.setRole(Role.USER);
        msg.setContent("damaged");
        msg.setSequenceNumber(0);
        msg.setSessionId(id);

        when(sessionRepository.findById(id)).thenReturn(Optional.of(session));
        when(chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(id))
                .thenReturn(List.of(msg));

        mockMvc.perform(get("/api/sessions/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.session.intent").value("RETURN"))
                .andExpect(jsonPath("$.messages[0].role").value("USER"))
                .andExpect(jsonPath("$.messages[0].content").value("damaged"));
    }
}
