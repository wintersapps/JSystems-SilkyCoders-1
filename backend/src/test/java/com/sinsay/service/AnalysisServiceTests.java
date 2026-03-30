package com.sinsay.service;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessage;
import com.sinsay.model.ChatMessage;
import com.sinsay.model.Intent;
import com.sinsay.model.Role;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class AnalysisServiceTests {

    @Autowired
    AnalysisService analysisService;

    @Autowired
    SessionRepository sessionRepository;

    @Autowired
    ChatMessageRepository chatMessageRepository;

    @MockitoBean
    OpenAIClient openAIClient;

    @MockitoBean
    PolicyDocService policyDocService;

    @BeforeEach
    void setupMocks() {
        when(policyDocService.getSystemPrompt(any())).thenReturn("System prompt");

        ChatCompletion mockCompletion = mock(ChatCompletion.class);
        ChatCompletion.Choice choice = mock(ChatCompletion.Choice.class);
        ChatCompletionMessage message = mock(ChatCompletionMessage.class);
        when(message.content()).thenReturn(Optional.of("AI decision text"));
        when(choice.message()).thenReturn(message);
        when(mockCompletion.choices()).thenReturn(List.of(choice));

        var chatMock = mock(com.openai.services.blocking.ChatService.class);
        var completionsMock = mock(com.openai.services.blocking.chat.ChatCompletionService.class);
        when(openAIClient.chat()).thenReturn(chatMock);
        when(chatMock.completions()).thenReturn(completionsMock);
        when(completionsMock.create(any(ChatCompletionCreateParams.class))).thenReturn(mockCompletion);
    }

    @Test // TAC-BE-03
    void analyze_buildsUserMessageWithTwoContentParts() {
        ArgumentCaptor<ChatCompletionCreateParams> captor = ArgumentCaptor.forClass(ChatCompletionCreateParams.class);

        byte[] imageBytes = "fake-image".getBytes();
        MockMultipartFile image = new MockMultipartFile("image", "test.jpg", "image/jpeg", imageBytes);

        analysisService.analyze(Intent.RETURN, "ORD-001", "Blue Jacket", "Item damaged", image);

        verify(openAIClient.chat().completions()).create(captor.capture());
        ChatCompletionCreateParams params = captor.getValue();

        // User message should exist
        var userMessages = params.messages().stream()
                .filter(m -> m.isUser())
                .toList();
        assertThat(userMessages).hasSize(1);

        // The params string representation should contain both image data URI and the description text
        String paramsStr = params.toString();
        assertThat(paramsStr).contains("data:image/jpeg;base64,");
        assertThat(paramsStr).contains("Item damaged");
    }

    @Test
    void analyze_base64EncodesImageAsDataUri() {
        ArgumentCaptor<ChatCompletionCreateParams> captor = ArgumentCaptor.forClass(ChatCompletionCreateParams.class);
        byte[] imageBytes = "test".getBytes();
        MockMultipartFile image = new MockMultipartFile("image", "test.jpg", "image/jpeg", imageBytes);

        analysisService.analyze(Intent.RETURN, "ORD-001", "Blue Jacket", "damaged", image);

        verify(openAIClient.chat().completions()).create(captor.capture());
        String paramsStr = captor.getValue().toString();
        assertThat(paramsStr).contains("data:image/jpeg;base64,");
    }

    @Test
    void analyze_persistsSessionAndTwoMessages() {
        MockMultipartFile image = new MockMultipartFile("image", "t.jpg", "image/jpeg", "x".getBytes());

        AnalysisService.AnalysisResult result = analysisService.analyze(
                Intent.COMPLAINT, "ORD-002", "Red Dress", "wrong color", image);

        assertThat(result.sessionId()).isNotNull();
        assertThat(result.message()).isEqualTo("AI decision text");

        Session session = sessionRepository.findById(result.sessionId()).orElseThrow();
        assertThat(session.getIntent()).isEqualTo(Intent.COMPLAINT);

        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(result.sessionId());
        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).getRole()).isEqualTo(Role.USER);
        assertThat(messages.get(0).getSequenceNumber()).isEqualTo(0);
        assertThat(messages.get(1).getRole()).isEqualTo(Role.ASSISTANT);
        assertThat(messages.get(1).getSequenceNumber()).isEqualTo(1);
        assertThat(messages.get(1).getContent()).isEqualTo("AI decision text");
    }
}
