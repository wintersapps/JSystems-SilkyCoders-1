package com.sinsay.controller;

import com.sinsay.model.ChatMessage;
import com.sinsay.model.Intent;
import com.sinsay.model.Role;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import com.sinsay.service.ChatService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChatControllerTests {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ChatService chatService;

    @MockitoBean
    SessionRepository sessionRepository;

    @MockitoBean
    ChatMessageRepository chatMessageRepository;

    @Test
    void postMessage_unknownSession_returns404() throws Exception {
        when(sessionRepository.findById(any())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/sessions/" + UUID.randomUUID() + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"messages":[{"role":"user","content":[{"type":"text","text":"hello"}]}]}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void postMessage_missingMessagesField_returns400() throws Exception {
        UUID id = UUID.randomUUID();
        Session session = buildSession(id, Intent.RETURN);
        when(sessionRepository.findById(id)).thenReturn(Optional.of(session));

        mockMvc.perform(post("/api/sessions/" + id + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postMessage_emptyMessagesArray_returns400() throws Exception {
        UUID id = UUID.randomUUID();
        Session session = buildSession(id, Intent.RETURN);
        when(sessionRepository.findById(id)).thenReturn(Optional.of(session));

        mockMvc.perform(post("/api/sessions/" + id + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"messages":[]}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postMessage_validRequest_delegatesToChatService() throws Exception {
        UUID id = UUID.randomUUID();
        Session session = buildSession(id, Intent.RETURN);
        when(sessionRepository.findById(id)).thenReturn(Optional.of(session));
        when(chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(id))
                .thenReturn(List.of());

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);

        mockMvc.perform(post("/api/sessions/" + id + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"messages":[{"role":"user","content":[{"type":"text","text":"What is my status?"}]}]}
                                """))
                .andExpect(status().isOk());

        verify(chatService).streamResponse(eq(session), any(), messageCaptor.capture(), any(ResponseBodyEmitter.class));
        assertThat(messageCaptor.getValue()).isEqualTo("What is my status?");
    }

    @Test
    void postMessage_validRequest_passesHistoryToChatService() throws Exception {
        UUID id = UUID.randomUUID();
        Session session = buildSession(id, Intent.COMPLAINT);

        ChatMessage existing = new ChatMessage();
        existing.setRole(Role.USER);
        existing.setContent("previous message");
        existing.setSequenceNumber(0);

        when(sessionRepository.findById(id)).thenReturn(Optional.of(session));
        when(chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(id))
                .thenReturn(List.of(existing));

        ArgumentCaptor<List<ChatMessage>> historyCaptor = ArgumentCaptor.captor();

        mockMvc.perform(post("/api/sessions/" + id + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"messages":[{"role":"user","content":[{"type":"text","text":"follow-up"}]}]}
                                """))
                .andExpect(status().isOk());

        verify(chatService).streamResponse(eq(session), historyCaptor.capture(), any(), any());
        assertThat(historyCaptor.getValue()).hasSize(1);
        assertThat(historyCaptor.getValue().get(0).getContent()).isEqualTo("previous message");
    }

    private Session buildSession(UUID id, Intent intent) {
        Session session = new Session();
        session.setIntent(intent);
        session.setOrderNumber("ORD-001");
        session.setProductName("Jacket");
        session.setDescription("test");
        // Simulate an already-persisted session with a known UUID via reflection is not needed;
        // Mockito stubs on findById(id) so the actual ID field doesn't need to be set
        return session;
    }
}
