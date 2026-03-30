package com.sinsay.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class VercelStreamEncoderTests {

    @Test // TAC-BE-04
    void encodeTextChunk_simpleText() {
        assertThat(VercelStreamEncoder.encodeTextChunk("Hello")).isEqualTo("0:\"Hello\"\n");
    }

    @Test
    void encodeTextChunk_escapesDoubleQuotes() {
        assertThat(VercelStreamEncoder.encodeTextChunk("it's \"great\""))
                .isEqualTo("0:\"it's \\\"great\\\"\"\n");
    }

    @Test
    void encodeTextChunk_escapesNewlines() {
        assertThat(VercelStreamEncoder.encodeTextChunk("line1\nline2"))
                .isEqualTo("0:\"line1\\nline2\"\n");
    }

    @Test // TAC-BE-05
    void encodeFinish() {
        assertThat(VercelStreamEncoder.encodeFinish()).isEqualTo("d:{\"finishReason\":\"stop\"}\n");
    }
}
