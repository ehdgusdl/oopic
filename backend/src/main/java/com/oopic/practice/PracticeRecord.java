package com.oopic.practice;

import com.oopic.question.QuestionType;

import java.util.List;

// 연습 기록 하나 (응답 body)
public record PracticeRecord(
        long id,
        QuestionType questionType,
        String questionText,
        String transcript,
        List<Pause> pauses,
        List<Integer> sentenceEnds,
        String createdAt
) {
}
