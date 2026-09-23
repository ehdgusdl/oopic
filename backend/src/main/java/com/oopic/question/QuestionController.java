package com.oopic.question;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// 질문 목록 조회, 조회, 추가, 삭제 API
@RestController
@RequestMapping("/questions")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    // 질문 목록 조회 (type 없으면 전체, id 오름차순)
    @GetMapping
    public List<Question> findAll(@RequestParam(required = false) QuestionType type) {
        return questionRepository.findAll(type);
    }

    // 질문 하나 조회
    @GetMapping("/{id}")
    public Question findById(@PathVariable long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다"));
    }

    // 질문 추가
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Question create(@Valid @RequestBody NewQuestion newQuestion) {
        return questionRepository.insert(newQuestion);
    }

    // 질문 삭제 (기본 질문은 삭제 불가)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        var question = questionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "질문을 찾을 수 없습니다"));
        if (question.isDefault()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "기본 질문은 삭제할 수 없습니다");
        }
        questionRepository.deleteById(id);
    }
}
