package com.sinsay.repository;

import com.sinsay.model.ChatMessage;
import com.sinsay.model.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatMessageRepositoryTests {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Test
    void findBySessionIdOrderBySequenceNumberAsc_returnsMessagesInOrder() {
        UUID sessionId = UUID.randomUUID();

        ChatMessage msg2 = buildMessage(sessionId, Role.ASSISTANT, "response", 1);
        ChatMessage msg1 = buildMessage(sessionId, Role.USER, "question", 0);

        chatMessageRepository.save(msg2);
        chatMessageRepository.save(msg1);

        List<ChatMessage> result = chatMessageRepository.findBySessionIdOrderBySequenceNumberAsc(sessionId);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getSequenceNumber()).isEqualTo(0);
        assertThat(result.get(1).getSequenceNumber()).isEqualTo(1);
    }

    private ChatMessage buildMessage(UUID sessionId, Role role, String content, int seq) {
        ChatMessage msg = new ChatMessage();
        msg.setSessionId(sessionId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setSequenceNumber(seq);
        return msg;
    }
}
