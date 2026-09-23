package com.oopic.practice;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oopic.question.QuestionType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

// record 테이블 접근. pauses, sentence_ends는 JSON 글자로 저장/조회한다
@Repository
public class PracticeRecordRepository {

    private final JdbcClient jdbcClient;
    private final ObjectMapper objectMapper;

    public PracticeRecordRepository(JdbcClient jdbcClient, ObjectMapper objectMapper) {
        this.jdbcClient = jdbcClient;
        this.objectMapper = objectMapper;
    }

    // 최신순(createdAt DESC, id DESC) 전체 조회
    public List<PracticeRecord> findAll() {
        return jdbcClient.sql("SELECT id, question_type, question_text, transcript, pauses, sentence_ends, created_at FROM record ORDER BY created_at DESC, id DESC")
                .query(this::mapRow)
                .list();
    }

    // id로 하나 조회
    public Optional<PracticeRecord> findById(long id) {
        return jdbcClient.sql("SELECT id, question_type, question_text, transcript, pauses, sentence_ends, created_at FROM record WHERE id = :id")
                .param("id", id)
                .query(this::mapRow)
                .optional();
    }

    // 기록 저장, createdAt은 서버가 UTC로 채운다
    public PracticeRecord save(NewPracticeRecord newRecord) {
        String pausesJson = writeJson(newRecord.pauses());
        String sentenceEndsJson = writeJson(newRecord.sentenceEnds());
        String createdAt = Instant.now().toString();

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcClient.sql("""
                        INSERT INTO record (question_type, question_text, transcript, pauses, sentence_ends, created_at)
                        VALUES (:questionType, :questionText, :transcript, :pauses, :sentenceEnds, :createdAt)
                        """)
                .param("questionType", newRecord.questionType().name())
                .param("questionText", newRecord.questionText())
                .param("transcript", newRecord.transcript())
                .param("pauses", pausesJson)
                .param("sentenceEnds", sentenceEndsJson)
                .param("createdAt", createdAt)
                .update(keyHolder);

        long id = keyHolder.getKey().longValue();
        return new PracticeRecord(id, newRecord.questionType(), newRecord.questionText(), newRecord.transcript(),
                newRecord.pauses(), newRecord.sentenceEnds(), createdAt);
    }

    // id로 삭제, 삭제된 행이 있었으면 true
    public boolean deleteById(long id) {
        int rows = jdbcClient.sql("DELETE FROM record WHERE id = :id")
                .param("id", id)
                .update();
        return rows > 0;
    }

    // 한 행을 PracticeRecord로 변환
    private PracticeRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new PracticeRecord(
                rs.getLong("id"),
                QuestionType.valueOf(rs.getString("question_type")),
                rs.getString("question_text"),
                rs.getString("transcript"),
                readList(rs.getString("pauses"), new TypeReference<List<Pause>>() {
                }),
                readList(rs.getString("sentence_ends"), new TypeReference<List<Integer>>() {
                }),
                rs.getString("created_at")
        );
    }

    // 객체를 JSON 글자로 변환
    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    // JSON 글자를 목록으로 변환
    private <T> T readList(String json, TypeReference<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
