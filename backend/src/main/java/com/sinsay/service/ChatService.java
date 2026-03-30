package com.sinsay.service;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.sinsay.model.ChatMessage;
import com.sinsay.model.Role;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final OpenAIClient openAIClient;
    private final PolicyDocService policyDocService;
    private final ChatMessageRepository chatMessageRepository;

    @Value("${openai.model:openai/gpt-4o-mini}")
    private String model;

    private final Executor executor = Executors.newVirtualThreadPerTaskExecutor();

    public void streamResponse(Session session, List<ChatMessage> history,
                               String newUserMessage, ResponseBodyEmitter emitter) {
        // 1. Persist USER message first
        int nextSeq = history.isEmpty() ? 0 : history.get(history.size() - 1).getSequenceNumber() + 1;
        ChatMessage userMsg = new ChatMessage();
        userMsg.setSessionId(session.getId());
        userMsg.setRole(Role.USER);
        userMsg.setContent(newUserMessage);
        userMsg.setSequenceNumber(nextSeq);
        chatMessageRepository.save(userMsg);

        // 2. Build params and stream in background thread
        String systemPrompt = policyDocService.getSystemPrompt(session.getIntent());
        ChatCompletionCreateParams params = buildParams(systemPrompt, history, newUserMessage);

        executor.execute(() -> {
            StringBuilder assistantContent = new StringBuilder();
            try {
                try (var streamResponse = openAIClient.chat().completions().createStreaming(params)) {
                    streamResponse.stream()
                            .flatMap(chunk -> chunk.choices().stream())
                            .flatMap(choice -> choice.delta().content().stream())
                            .forEach(delta -> {
                                assistantContent.append(delta);
                                try {
                                    emitter.send(VercelStreamEncoder.encodeTextChunk(delta));
                                } catch (IOException e) {
                                    throw new RuntimeException("Failed to write to emitter", e);
                                }
                            });
                }

                emitter.send(VercelStreamEncoder.encodeFinish());

                // Persist ASSISTANT message
                ChatMessage assistantMsg = new ChatMessage();
                assistantMsg.setSessionId(session.getId());
                assistantMsg.setRole(Role.ASSISTANT);
                assistantMsg.setContent(assistantContent.toString());
                assistantMsg.setSequenceNumber(nextSeq + 1);
                chatMessageRepository.save(assistantMsg);

                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
    }

    private ChatCompletionCreateParams buildParams(String systemPrompt,
                                                   List<ChatMessage> history,
                                                   String newUserMessage) {
        ChatCompletionCreateParams.Builder builder = ChatCompletionCreateParams.builder()
                .model(model)
                .addSystemMessage(systemPrompt);

        for (ChatMessage msg : history) {
            if (msg.getRole() == Role.USER) {
                builder.addUserMessage(msg.getContent());
            } else {
                builder.addAssistantMessage(msg.getContent());
            }
        }

        builder.addUserMessage(newUserMessage);

        return builder.build();
    }
}
