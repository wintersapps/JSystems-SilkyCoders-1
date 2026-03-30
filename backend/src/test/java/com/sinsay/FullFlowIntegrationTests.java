package com.sinsay;

import com.openai.client.OpenAIClient;
import com.openai.core.JsonValue;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionChunk;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessage;
import com.sinsay.model.Role;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import com.sinsay.service.PolicyDocService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FullFlowIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired SessionRepository sessionRepository;
    @Autowired ChatMessageRepository chatMessageRepository;
    @MockitoBean OpenAIClient openAIClient;
    @MockitoBean PolicyDocService policyDocService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setupOpenAIMock() {
        when(policyDocService.getSystemPrompt(any())).thenReturn("System prompt");

        // Mock sync completion for AnalysisService (POST /api/sessions)
        ChatCompletion mockCompletion = mock(ChatCompletion.class);
        ChatCompletion.Choice choice = mock(ChatCompletion.Choice.class);
        ChatCompletionMessage message = mock(ChatCompletionMessage.class);
        when(message.content()).thenReturn(Optional.of("Testowa analiza AI"));
        when(choice.message()).thenReturn(message);
        when(mockCompletion.choices()).thenReturn(List.of(choice));

        var chatMock = mock(com.openai.services.blocking.ChatService.class);
        var completionsMock = mock(com.openai.services.blocking.chat.ChatCompletionService.class);
        when(openAIClient.chat()).thenReturn(chatMock);
        when(chatMock.completions()).thenReturn(completionsMock);
        when(completionsMock.create(any(ChatCompletionCreateParams.class))).thenReturn(mockCompletion);

        // Mock streaming for ChatService (POST /api/sessions/{id}/messages)
        ChatCompletionChunk chunk = ChatCompletionChunk.builder()
                .id("chunk-1")
                .model("gpt-4o-mini")
                .object_(JsonValue.from("chat.completion.chunk"))
                .created(System.currentTimeMillis() / 1000)
                .addChoice(ChatCompletionChunk.Choice.builder()
                        .index(0)
                        .delta(ChatCompletionChunk.Choice.Delta.builder()
                                .content("Testowa odpowiedź AI")
                                .build())
                        .finishReason(ChatCompletionChunk.Choice.FinishReason.STOP)
                        .build())
                .build();

        StreamResponse<ChatCompletionChunk> streamResponse = mock(StreamResponse.class);
        when(completionsMock.createStreaming(any(ChatCompletionCreateParams.class))).thenReturn(streamResponse);
        when(streamResponse.stream()).thenReturn(Stream.of(chunk));
    }

    @Test
    // TAC-01: POST /api/sessions returns 200 with sessionId and message
    void step1_postSession_returns200WithSessionIdAndMessage() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
            "image", "product.jpg", "image/jpeg", "fake-image-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/sessions")
                .file(image)
                .param("intent", "RETURN")
                .param("orderNumber", "ORD-FLOW-001")
                .param("productName", "Test Product")
                .param("description", "Product has a defect"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionId").isNotEmpty())
            .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    // TAC-07: GET /api/sessions/{id} returns session + messages in order
    void step2_getSession_returnsSessionAndMessagesInOrder() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
            "image", "p.jpg", "image/jpeg", "bytes".getBytes()
        );
        MvcResult createResult = mockMvc.perform(multipart("/api/sessions")
                .file(image)
                .param("intent", "COMPLAINT")
                .param("orderNumber", "ORD-FLOW-002")
                .param("productName", "Red Dress")
                .param("description", "Wrong color delivered"))
            .andExpect(status().isOk())
            .andReturn();

        String sessionId = extractSessionId(createResult.getResponse().getContentAsString());

        mockMvc.perform(get("/api/sessions/" + sessionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.session.id").value(sessionId))
            .andExpect(jsonPath("$.session.intent").value("COMPLAINT"))
            .andExpect(jsonPath("$.session.orderNumber").value("ORD-FLOW-002"))
            .andExpect(jsonPath("$.messages").isArray())
            .andExpect(jsonPath("$.messages.length()").value(2))
            .andExpect(jsonPath("$.messages[0].role").value("USER"))
            .andExpect(jsonPath("$.messages[1].role").value("ASSISTANT"));
    }

    @Test
    // TAC-09 + TAC-10: POST /api/sessions/{id}/messages returns Vercel stream
    void step3_postMessage_returnsVercelStream() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
            "image", "p.jpg", "image/jpeg", "bytes".getBytes()
        );
        MvcResult createResult = mockMvc.perform(multipart("/api/sessions")
                .file(image)
                .param("intent", "RETURN")
                .param("orderNumber", "ORD-FLOW-003")
                .param("productName", "Jacket")
                .param("description", "Damaged zipper"))
            .andExpect(status().isOk())
            .andReturn();

        String sessionId = extractSessionId(createResult.getResponse().getContentAsString());

        String chatBody = """
            {"messages":[{"role":"user","content":[{"type":"text","text":"Czy moge zwrocic?"}]}]}
            """;

        MvcResult asyncResult = mockMvc.perform(post("/api/sessions/" + sessionId + "/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatBody))
            .andExpect(request().asyncStarted())
            .andReturn();

        MvcResult chatResult = mockMvc.perform(asyncDispatch(asyncResult))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Vercel-AI-Data-Stream", "v1"))
            .andReturn();

        String streamBody = chatResult.getResponse().getContentAsString();
        assertThat(streamBody).contains("0:\"");
        assertThat(streamBody).contains("d:{\"finishReason\":\"stop\"}");
    }

    @Test
    // TAC-11 + TAC-12: After streaming, DB has all messages; data persists
    void step4_afterFullFlow_dbHasAllMessages() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
            "image", "p.jpg", "image/jpeg", "bytes".getBytes()
        );
        MvcResult createResult = mockMvc.perform(multipart("/api/sessions")
                .file(image)
                .param("intent", "RETURN")
                .param("orderNumber", "ORD-FLOW-004")
                .param("productName", "Shoes")
                .param("description", "Wrong size"))
            .andExpect(status().isOk())
            .andReturn();

        String sessionId = extractSessionId(createResult.getResponse().getContentAsString());
        UUID sessionUUID = UUID.fromString(sessionId);

        // Initial: 2 messages (USER + ASSISTANT from analysis)
        assertThat(chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(sessionUUID)).hasSize(2);

        String chatBody = """
            {"messages":[{"role":"user","content":[{"type":"text","text":"follow-up question"}]}]}
            """;
        mockMvc.perform(post("/api/sessions/" + sessionId + "/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(chatBody))
            .andExpect(status().isOk());

        // Wait briefly for async stream to complete
        Thread.sleep(500);
        var messages = chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(sessionUUID);
        assertThat(messages).hasSize(4);
        assertThat(messages.get(2).getRole()).isEqualTo(Role.USER);
        assertThat(messages.get(3).getRole()).isEqualTo(Role.ASSISTANT);
    }

    private String extractSessionId(String json) {
        int start = json.indexOf("\"sessionId\":\"") + 13;
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
