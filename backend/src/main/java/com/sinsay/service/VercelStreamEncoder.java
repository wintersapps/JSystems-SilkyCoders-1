package com.sinsay.service;

public final class VercelStreamEncoder {

    private VercelStreamEncoder() {}

    public static String encodeTextChunk(String text) {
        String escaped = text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
        return "0:\"" + escaped + "\"\n";
    }

    public static String encodeFinish() {
        return "d:{\"finishReason\":\"stop\"}\n";
    }
}
