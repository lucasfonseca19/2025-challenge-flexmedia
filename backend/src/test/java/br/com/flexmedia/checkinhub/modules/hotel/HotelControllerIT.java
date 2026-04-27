package br.com.flexmedia.checkinhub.modules.hotel;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class HotelControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void getHoteis_semAutenticacao_retorna401() throws Exception {
        mockMvc.perform(get("/api/hoteis"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHoteis_autenticado_retorna200() throws Exception {
        mockMvc.perform(get("/api/hoteis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void criarHotel_dadosValidos_retorna201() throws Exception {
        var body = Map.of(
                "nome", "Hotel Integração",
                "cnpj", "12.345.678/0001-99",
                "cidade", "São Paulo",
                "estado", "SP"
        );

        mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Hotel Integração"))
                .andExpect(jsonPath("$.cnpj").value("12.345.678/0001-99"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @WithMockUser(roles = "OPERADOR")
    void criarHotel_comOperador_retorna403() throws Exception {
        var body = Map.of(
                "nome", "Hotel Bloqueado",
                "cnpj", "88.777.666/0001-55",
                "cidade", "Santos",
                "estado", "SP"
        );

        mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void criarHotel_cnpjDuplicado_retorna422() throws Exception {
        var body = Map.of(
                "nome", "Hotel A",
                "cnpj", "99.888.777/0001-66",
                "cidade", "Rio",
                "estado", "RJ"
        );

        // 1ª criação deve ter sucesso
        mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // 2ª criação com mesmo CNPJ deve retornar 422
        mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void criarHotel_camposObrigatoriosAusentes_retorna400() throws Exception {
        var body = Map.of("nome", "Sem CNPJ");

        mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void buscarHotelPorId_quandoNaoExiste_retorna404() throws Exception {
        mockMvc.perform(get("/api/hoteis/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void desativarHotel_quandoExiste_retorna204() throws Exception {
        // Cria um hotel primeiro
        var body = Map.of(
                "nome", "Hotel Para Desativar",
                "cnpj", "11.222.333/0001-44",
                "cidade", "Curitiba",
                "estado", "PR"
        );

        String response = mockMvc.perform(post("/api/hoteis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(patch("/api/hoteis/" + id + "/desativar"))
                .andExpect(status().isNoContent());
    }
}
