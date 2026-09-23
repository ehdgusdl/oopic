package com.oopic.practice;

import com.oopic.question.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// POST /records 요청 body
public record NewPracticeRecord(
        @NotNull QuestionType questionType,
        @NotBlank String questionText,
        @NotBlank @Size(max = 10000) String transcript,
        @NotNull List<@NotNull @Valid Pause> pauses,
        @NotNull List<@NotNull @Min(0) Integer> sentenceEnds
) {
}
