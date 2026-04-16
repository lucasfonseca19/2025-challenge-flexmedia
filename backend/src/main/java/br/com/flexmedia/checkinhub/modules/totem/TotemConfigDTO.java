package br.com.flexmedia.checkinhub.modules.totem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TotemConfigDTO {
    private Long id;
    private String codigo;
    private String nome;
    private Long hotelId;
    private ConfigDTO config;
    private List<ConteudoDTO> conteudo;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfigDTO {
        private String nomeExibido;
        private String logoUrl;
        private String corPrimaria;
        private String idiomasAtivos;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConteudoDTO {
        private Long id;
        private String tipo;
        private String titulo;
        private String urlMidia;
        private int ordemExibicao;
    }
}
