package com.sinsay.repository;

import com.sinsay.model.Intent;
import com.sinsay.model.Session;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SessionRepositoryTests {

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void saveAndFindById_returnsCorrectFields() {
        Session session = new Session();
        session.setIntent(Intent.RETURN);
        session.setOrderNumber("ORD-001");
        session.setProductName("Blue Jacket");
        session.setDescription("Item is damaged");
        Session saved = sessionRepository.save(session);

        Session found = sessionRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getIntent()).isEqualTo(Intent.RETURN);
        assertThat(found.getOrderNumber()).isEqualTo("ORD-001");
        assertThat(found.getProductName()).isEqualTo("Blue Jacket");
        assertThat(found.getDescription()).isEqualTo("Item is damaged");
        assertThat(found.getCreatedAt()).isNotNull();
    }
}
