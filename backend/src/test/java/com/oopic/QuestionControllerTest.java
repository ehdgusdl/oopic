package com.oopic;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 질문 API 테스트. DB는 테스트 동안 유지되는 메모리 SQLite라 순서에 의존하지 않게 작성한다
@SpringBootTest
@AutoConfigureMockMvc
class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // 전체 조회: 기본 질문 35개가 id 오름차순으로 포함되어 있다
    @Test
    void 전체_질문_조회() throws Exception {
        mockMvc.perform(get("/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(35)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].type").value("INTRO"))
                .andExpect(jsonPath("$[0].isDefault").value(true));
    }

    // 유형별 조회: INTRO 유형만 돌아온다
    @Test
    void 유형별_질문_조회() throws Exception {
        mockMvc.perform(get("/questions").param("type", "INTRO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$[0].type").value("INTRO"));
    }

    // 잘못된 유형으로 조회하면 400
    @Test
    void 잘못된_유형_조회는_400() throws Exception {
        mockMvc.perform(get("/questions").param("type", "FOO"))
                .andExpect(status().isBadRequest());
    }

    // 질문 하나 조회
    @Test
    void 질문_하나_조회() throws Exception {
        mockMvc.perform(get("/questions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.type").value("INTRO"))
                .andExpect(jsonPath("$.isDefault").value(true));
    }

    // 없는 질문 조회는 404, detail 메시지 확인
    @Test
    void 없는_질문_조회는_404() throws Exception {
        mockMvc.perform(get("/questions/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("질문을 찾을 수 없습니다"));
    }

    // 질문 추가: 201과 앞뒤 공백 제거된 text, isDefault=false 확인
    @Test
    void 질문_추가_공백_제거() throws Exception {
        mockMvc.perform(post("/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"PAST\",\"text\":\"  hello world  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("PAST"))
                .andExpect(jsonPath("$.text").value("hello world"))
                .andExpect(jsonPath("$.isDefault").value(false));
    }

    // 빈 글로 추가하면 400
    @Test
    void 빈_글_추가는_400() throws Exception {
        mockMvc.perform(post("/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"PAST\",\"text\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    // 301자 글로 추가하면 400
    @Test
    void 삼백일자_글_추가는_400() throws Exception {
        String text = "a".repeat(301);
        mockMvc.perform(post("/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"PAST\",\"text\":\"" + text + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // 잘못된 유형으로 추가하면 400
    @Test
    void 잘못된_유형_추가는_400() throws Exception {
        mockMvc.perform(post("/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"FOO\",\"text\":\"hello\"}"))
                .andExpect(status().isBadRequest());
    }

    // 내가 추가한 질문은 삭제할 수 있다 (204)
    @Test
    void 내가_추가한_질문_삭제() throws Exception {
        String response = mockMvc.perform(post("/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"PAST\",\"text\":\"delete me\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) com.jayway.jsonpath.JsonPath.read(response, "$.id")).longValue();

        mockMvc.perform(delete("/questions/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/questions/" + id))
                .andExpect(status().isNotFound());
    }

    // 기본 질문은 삭제할 수 없다 (403)
    @Test
    void 기본_질문_삭제는_403() throws Exception {
        mockMvc.perform(delete("/questions/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("기본 질문은 삭제할 수 없습니다"));
    }

    // 없는 질문 삭제는 404
    @Test
    void 없는_질문_삭제는_404() throws Exception {
        mockMvc.perform(delete("/questions/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("질문을 찾을 수 없습니다"));
    }
}
