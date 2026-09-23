package com.oopic.practice;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

// 멈춤 한 번: 몇 번째 단어 뒤에서, 몇 초 멈췄는지
public record Pause(@Min(0) int afterWord, @Positive double sec) {
}
