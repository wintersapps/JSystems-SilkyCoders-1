package com.sinsay.service;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletionContentPart;
import com.openai.models.chat.completions.ChatCompletionContentPartImage;
import com.openai.models.chat.completions.ChatCompletionContentPartText;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionContentPartImage.ImageUrl;
import com.sinsay.model.ChatMessage;
import com.sinsay.model.Intent;
import com.sinsay.model.Role;
import com.sinsay.model.Session;
import com.sinsay.repository.ChatMessageRepository;
import com.sinsay.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final OpenAIClient openAIClient;
    private final PolicyDocService policyDocService;
    private final SessionRepository sessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Value("${openai.model:openai/gpt-4o-mini}")
    private String model;

    public record AnalysisResult(UUID sessionId, String message) {}

    public AnalysisResult analyze(Intent intent, String orderNumber, String productName,
                                  String description, MultipartFile image) {
        // 1. Base64-encode image
        String dataUri = encodeImageToDataUri(image);

        // 2. Get system prompt from policy docs
        String systemPrompt = policyDocService.getSystemPrompt(intent);

        // 3. Build OpenAI request with image + text content parts
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                .model(model)
                .addSystemMessage(systemPrompt)
                .addUserMessageOfArrayOfContentParts(List.of(
                        ChatCompletionContentPart.ofImageUrl(
                                ChatCompletionContentPartImage.builder()
                                        .imageUrl(ImageUrl.builder()
                                                .url(dataUri)
                                                .build())
                                        .build()
                        ),
                        ChatCompletionContentPart.ofText(
                                ChatCompletionContentPartText.builder()
                                        .text(description)
                                        .build()
                        )
                ))
                .build();

        // 4. Call OpenAI synchronously
        var completion = openAIClient.chat().completions().create(params);
        String aiMessage = completion.choices().get(0).message().content()
                .orElse("");

        // 5. Persist Session
        Session session = new Session();
        session.setIntent(intent);
        session.setOrderNumber(orderNumber);
        session.setProductName(productName);
        session.setDescription(description);
        session = sessionRepository.save(session);

        // 6. Persist USER message (seq 0) and ASSISTANT message (seq 1)
        ChatMessage userMsg = new ChatMessage();
        userMsg.setSessionId(session.getId());
        userMsg.setRole(Role.USER);
        userMsg.setContent(description);
        userMsg.setSequenceNumber(0);
        chatMessageRepository.save(userMsg);

        ChatMessage assistantMsg = new ChatMessage();
        assistantMsg.setSessionId(session.getId());
        assistantMsg.setRole(Role.ASSISTANT);
        assistantMsg.setContent(aiMessage);
        assistantMsg.setSequenceNumber(1);
        chatMessageRepository.save(assistantMsg);

        return new AnalysisResult(session.getId(), aiMessage);
    }

    private String encodeImageToDataUri(MultipartFile image) {
        try {
            byte[] bytes = image.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String contentType = image.getContentType() != null ? image.getContentType() : "image/jpeg";
            return "data:" + contentType + ";base64," + base64;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to encode image", e);
        }
    }
}
