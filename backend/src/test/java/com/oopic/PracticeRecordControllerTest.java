package com.oopic;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oopic.practice.NewPracticeRecord;
import com.oopic.practice.Pause;
import com.oopic.question.QuestionType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 연습 기록 API 테스트
@SpringBootTest
@AutoConfigureMockMvc
class PracticeRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // 유효한 요청 body 하나 만들기
    private NewPracticeRecord validRecord(String transcript) {
        return new NewPracticeRecord(
                QuestionType.PAST,
                "Tell me about the most memorable trip you have taken.",
                transcript,
                List.of(new Pause(6, 1.3), new Pause(9, 2.1)),
                List.of(6));
    }

    private long postAndGetId(NewPracticeRecord body) throws Exception {
        String response = mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    // 저장하면 201과 채워진 createdAt을 돌려준다
    @Test
    void createReturns201WithCreatedAt() throws Exception {
        mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRecord("I went to Jeju last year."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.questionType").value("PAST"))
                .andExpect(jsonPath("$.transcript").value("I went to Jeju last year."))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    // 목록은 최신순(createdAt DESC, id DESC)으로 온다. 나중에 만든 기록이 먼저 나와야 한다
    @Test
    void listIsOrderedNewestFirst() throws Exception {
        long olderId = postAndGetId(validRecord("older record"));
        long newerId = postAndGetId(validRecord("newer record"));

        String listBody = mockMvc.perform(get("/records"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode list = objectMapper.readTree(listBody);
        int newerIndex = -1;
        int olderIndex = -1;
        for (int i = 0; i < list.size(); i++) {
            long id = list.get(i).get("id").asLong();
            if (id == newerId) newerIndex = i;
            if (id == olderId) olderIndex = i;
        }

        assertTrue(newerIndex >= 0 && olderIndex >= 0, "두 기록 모두 목록에 있어야 한다");
        assertTrue(newerIndex < olderIndex, "나중에 만든 기록이 먼저 나와야 한다");
    }

    // 하나 조회, 없는 id는 404와 메시지
    @Test
    void findByIdAndNotFound() throws Exception {
        long id = postAndGetId(validRecord("find me"));

        mockMvc.perform(get("/records/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transcript").value("find me"));

        mockMvc.perform(get("/records/987654321"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("기록을 찾을 수 없습니다"));
    }

    // 빈 transcript는 400
    @Test
    void blankTranscriptReturns400() throws Exception {
        NewPracticeRecord invalid = new NewPracticeRecord(
                QuestionType.PAST, "question text", "", List.of(), List.of());
        mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // pauses가 null이면 400
    @Test
    void nullPausesReturns400() throws Exception {
        NewPracticeRecord invalid = new NewPracticeRecord(
                QuestionType.PAST, "question text", "some transcript", null, List.of());
        mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // afterWord가 음수면 400
    @Test
    void negativeAfterWordReturns400() throws Exception {
        NewPracticeRecord invalid = new NewPracticeRecord(
                QuestionType.PAST, "question text", "some transcript",
                List.of(new Pause(-1, 1.0)), List.of());
        mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // pauses 안에 null 원소가 있으면 400
    @Test
    void nullPauseElementReturns400() throws Exception {
        String body = """
                {"questionType":"PAST","questionText":"q","transcript":"t","pauses":[null],"sentenceEnds":[]}
                """;
        mockMvc.perform(post("/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // 삭제하면 204, 같은 id를 다시 삭제하면 404
    @Test
    void deleteReturns204ThenNotFound404() throws Exception {
        long id = postAndGetId(validRecord("delete me"));

        mockMvc.perform(delete("/records/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/records/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("기록을 찾을 수 없습니다"));
    }
}
