package br.com.flexmedia.checkinhub.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        usuarioRepository.save(Usuario.builder()
                .nome("Admin Teste")
                .email("admin@test.com")
                .senha(passwordEncoder.encode("senha123"))
                .role(RoleUsuario.ADMIN)
                .ativo(true)
                .build());
    }

    @Test
    void login_credenciaisValidas_retorna200ComToken() throws Exception {
        var body = Map.of("email", "admin@test.com", "senha", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value("admin@test.com"))
                .andExpect(jsonPath("$.usuario.role").value("ADMIN"));
    }

    @Test
    void login_senhaErrada_retorna401() throws Exception {
        var body = Map.of("email", "admin@test.com", "senha", "senhaErrada");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_usuarioInexistente_retorna401() throws Exception {
        var body = Map.of("email", "naoexiste@test.com", "senha", "qualquer");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_bodyInvalido_retorna400() throws Exception {
        var body = Map.of("email", "nao-e-email", "senha", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void desativarUsuario_quandoForOutroUsuario_retorna204() throws Exception {
        Usuario outroUsuario = usuarioRepository.save(Usuario.builder()
                .nome("Operador Teste")
                .email("operador@test.com")
                .senha(passwordEncoder.encode("senha123"))
                .role(RoleUsuario.OPERADOR)
                .ativo(true)
                .build());

        mockMvc.perform(delete("/api/auth/usuarios/" + outroUsuario.getId()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void desativarUsuario_quandoForProprioUsuario_retorna422() throws Exception {
        Usuario admin = usuarioRepository.findByEmailAndAtivoTrue("admin@test.com").orElseThrow();

        mockMvc.perform(delete("/api/auth/usuarios/" + admin.getId()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("Não é possível desativar o próprio usuário logado."));
    }
}
