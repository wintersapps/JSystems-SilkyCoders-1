package com.sinsay.service;

import com.sinsay.model.Intent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PolicyDocServiceTests {

    @Autowired
    private PolicyDocService policyDocService;

    @Test // TAC-BE-01
    void getSystemPrompt_RETURN_doesNotContainReklamacjeDoc() {
        String prompt = policyDocService.getSystemPrompt(Intent.RETURN);
        // "Jak złożyć reklamację?" is the heading unique to reklamacje.md (not in regulamin.md)
        assertThat(prompt).doesNotContain("Jak złożyć reklamację?");
    }

    @Test // TAC-BE-02
    void getSystemPrompt_COMPLAINT_doesNotContainZwrotDniDoc() {
        String prompt = policyDocService.getSystemPrompt(Intent.COMPLAINT);
        // "Sposoby zwrotu" is the heading unique to zwrot-30-dni.md (not in regulamin.md)
        assertThat(prompt).doesNotContain("Sposoby zwrotu");
    }

    @Test
    void getSystemPrompt_RETURN_containsRequiredSections() {
        String prompt = policyDocService.getSystemPrompt(Intent.RETURN);
        assertThat(prompt).containsIgnoringCase("sinsay");
        assertThat(prompt).containsIgnoringCase("polsk"); // language instruction
        assertThat(prompt).containsIgnoringCase("zwrot");  // from zwrot-30-dni.md
    }

    @Test
    void getSystemPrompt_COMPLAINT_containsRequiredSections() {
        String prompt = policyDocService.getSystemPrompt(Intent.COMPLAINT);
        assertThat(prompt).containsIgnoringCase("sinsay");
        assertThat(prompt).containsIgnoringCase("polsk");
        assertThat(prompt).containsIgnoringCase("reklamacj");
    }

    @Test
    void getSystemPrompt_containsRoleDefinition() {
        String prompt = policyDocService.getSystemPrompt(Intent.RETURN);
        assertThat(prompt).containsIgnoringCase("asystent");
    }

    @Test
    void getSystemPrompt_containsDisclaimer() {
        String prompt = policyDocService.getSystemPrompt(Intent.RETURN);
        // disclaimer says assessment is non-binding
        assertThat(prompt).containsAnyOf("niewiążąca", "ostateczn", "człowiek", "pracownik");
    }
}
