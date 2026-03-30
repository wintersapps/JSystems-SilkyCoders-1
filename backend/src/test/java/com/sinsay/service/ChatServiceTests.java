package com.sinsay.service;

import com.openai.client.OpenAIClient;
import com.openai.core.JsonValue;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletionChunk;
import com.sinsay.model.Intent;
import com.sinsay.model.Role;
import com.sinsay.model.Session;
import com.sinsay.model.ChatMessage;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class ChatServiceTests {

    @Autowired
    ChatService chatService;

    @Autowired
    ChatMessageRepository chatMessageRepository;

    @Autowired
    SessionRepository sessionRepository;

    @MockitoBean
    OpenAIClient openAIClient;

    @Test // TAC-BE-06
    @SuppressWarnings("unchecked")
    void streamResponse_persistsUserAndAssistantMessages() throws Exception {
        // Setup session
        Session session = new Session();
        session.setIntent(Intent.RETURN);
        session.setOrderNumber("ORD-001");
        session.setProductName("Blue Jacket");
        session.setDescription("damaged");
        session = sessionRepository.save(session);

        // Build a minimal ChatCompletionChunk with delta content "Hello"
        ChatCompletionChunk chunk = buildChunkWithContent("Hello");

        // Mock the streaming call chain: client.chat().completions().createStreaming(any)
        var chatMock = mock(com.openai.services.blocking.ChatService.class);
        var completionsMock = mock(com.openai.services.blocking.chat.ChatCompletionService.class);
        StreamResponse<ChatCompletionChunk> streamResponse = mock(StreamResponse.class);

        when(openAIClient.chat()).thenReturn(chatMock);
        when(chatMock.completions()).thenReturn(completionsMock);
        when(completionsMock.createStreaming(any(com.openai.models.chat.completions.ChatCompletionCreateParams.class))).thenReturn(streamResponse);
        when(streamResponse.stream()).thenReturn(Stream.of(chunk));

        ResponseBodyEmitter emitter = new ResponseBodyEmitter();

        chatService.streamResponse(session, List.of(), "test message", emitter);

        // Wait briefly for async operation
        Thread.sleep(500);

        List<ChatMessage> messages = chatMessageRepository
                .findBySessionIdOrderBySequenceNumberAsc(session.getId());

        // USER message should be persisted
        assertThat(messages).anyMatch(m -> m.getRole() == Role.USER && m.getContent().equals("test message"));
        // ASSISTANT message should be persisted after stream
        assertThat(messages).anyMatch(m -> m.getRole() == Role.ASSISTANT);
    }

    /**
     * Builds a ChatCompletionChunk with a single choice containing the given delta content.
     * Uses the SDK's builder API to construct a valid chunk object.
     */
    private ChatCompletionChunk buildChunkWithContent(String content) {
        return ChatCompletionChunk.builder()
                .id("chunk-1")
                .model("gpt-4o-mini")
                .object_(JsonValue.from("chat.completion.chunk"))
                .created(System.currentTimeMillis() / 1000)
                .addChoice(ChatCompletionChunk.Choice.builder()
                        .index(0)
                        .delta(ChatCompletionChunk.Choice.Delta.builder()
                                .content(content)
                                .build())
                        .finishReason(ChatCompletionChunk.Choice.FinishReason.STOP)
                        .build())
                .build();
    }
}
