package com.oopic.question;

import com.fasterxml.jackson.annotation.JsonProperty;

// 질문 하나를 나타내는 응답 모양
public record Question(
        long id,
        QuestionType type,
        String text,
        @JsonProperty("isDefault") boolean isDefault
) {
}
