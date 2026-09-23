package com.oopic.practice;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// 연습 기록 API. Service 없이 Repository를 바로 쓴다
@RestController
@RequestMapping("/records")
public class PracticeRecordController {

    private final PracticeRecordRepository repository;

    public PracticeRecordController(PracticeRecordRepository repository) {
        this.repository = repository;
    }

    // 기록 목록, 최신순
    @GetMapping
    public List<PracticeRecord> findAll() {
        return repository.findAll();
    }

    // 기록 하나, 없으면 404
    @GetMapping("/{id}")
    public PracticeRecord findById(@PathVariable long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다"));
    }

    // 기록 저장
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PracticeRecord create(@Valid @RequestBody NewPracticeRecord newRecord) {
        return repository.save(newRecord);
    }

    // 기록 삭제, 없으면 404
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        if (!repository.deleteById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기록을 찾을 수 없습니다");
        }
    }
}
