package com.oopic.question;

import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

// question 테이블 접근
@Repository
public class QuestionRepository {

    private final JdbcClient jdbcClient;

    public QuestionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    // type이 있으면 그 유형만, 없으면 전체를 id 오름차순으로 조회
    public List<Question> findAll(QuestionType type) {
        var sql = "SELECT id, type, text, is_default FROM question"
                + (type == null ? "" : " WHERE type = :type")
                + " ORDER BY id ASC";
        var spec = jdbcClient.sql(sql);
        if (type != null) {
            spec = spec.param("type", type.name());
        }
        return spec.query(QuestionRepository::mapRow).list();
    }

    // id로 질문 하나 조회
    public Optional<Question> findById(long id) {
        return jdbcClient.sql("SELECT id, type, text, is_default FROM question WHERE id = :id")
                .param("id", id)
                .query(QuestionRepository::mapRow)
                .optional();
    }

    // 새 질문을 저장하고 생성된 질문(isDefault=false)을 반환
    public Question insert(NewQuestion newQuestion) {
        var keyHolder = new GeneratedKeyHolder();
        jdbcClient.sql("INSERT INTO question (type, text, is_default) VALUES (:type, :text, 0)")
                .param("type", newQuestion.type().name())
                .param("text", newQuestion.text())
                .update(keyHolder);
        long id = keyHolder.getKey().longValue();
        return new Question(id, newQuestion.type(), newQuestion.text(), false);
    }

    // id로 질문 삭제
    public void deleteById(long id) {
        jdbcClient.sql("DELETE FROM question WHERE id = :id")
                .param("id", id)
                .update();
    }

    // 결과 행 하나를 Question으로 변환
    private static Question mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new Question(
                rs.getLong("id"),
                QuestionType.valueOf(rs.getString("type")),
                rs.getString("text"),
                rs.getInt("is_default") == 1
        );
    }
}
