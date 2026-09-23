package com.oopic.question;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// POST /questions 요청 body: 앞뒤 공백을 뺀 뒤 1~300자인지 검증
public record NewQuestion(
        @NotNull QuestionType type,
        @NotBlank @Size(max = 300) String text
) {
    public NewQuestion {
        text = text == null ? null : text.trim();
    }
}
