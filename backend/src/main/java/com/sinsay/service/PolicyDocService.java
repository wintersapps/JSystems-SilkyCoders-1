package com.sinsay.service;

import com.sinsay.model.Intent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PolicyDocService {

    @Value("${policy-docs.path:../docs}")
    private String policyDocsPath;

    // Lazy-loaded on first call
    private String regulaminContent;
    private String reklamacjeContent;
    private String zwrotContent;

    public String getSystemPrompt(Intent intent) {
        loadDocsIfNeeded();
        return buildSystemPrompt(intent);
    }

    private synchronized void loadDocsIfNeeded() {
        if (regulaminContent == null) {
            regulaminContent = readFile("regulamin.md");
            reklamacjeContent = readFile("reklamacje.md");
            zwrotContent = readFile("zwrot-30-dni.md");
        }
    }

    private String readFile(String filename) {
        try {
            return Files.readString(Path.of(policyDocsPath, filename));
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read policy file: " + filename, e);
        }
    }

    private String buildSystemPrompt(Intent intent) {
        String intentDoc = (intent == Intent.RETURN) ? zwrotContent : reklamacjeContent;
        return """
                Jesteś asystentem AI sklepu Sinsay. Twoim zadaniem jest pomoc klientom w ocenie, czy ich zwrot lub reklamacja prawdopodobnie zostanie zaakceptowana zgodnie z polityką sklepu Sinsay oraz na podstawie dostarczonego zdjęcia produktu.

                ## Kategorie decyzji
                Używaj wyłącznie tych trzech kategorii:
                - Prawdopodobnie zaakceptowane
                - Prawdopodobnie odrzucone
                - Niejasne — wymaga ręcznego przeglądu

                ## Zastrzeżenie (OBOWIĄZKOWE)
                Każda odpowiedź musi zawierać informację, że ocena jest niewiążąca i ostateczną decyzję zawsze podejmuje człowiek — pracownik działu obsługi klienta Sinsay.

                ## Zakres działania
                Odpowiadaj wyłącznie na pytania dotyczące polityki Sinsay, procedur zwrotów i reklamacji oraz powiązanych tematów, wyłącznie na podstawie dostarczonych dokumentów. Przekierowuj pytania spoza zakresu.

                ## Język
                Zawsze odpowiadaj po polsku.

                ## Dokumenty polityki
                """ + regulaminContent + "\n\n" + intentDoc;
    }
}
