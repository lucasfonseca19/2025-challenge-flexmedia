package br.com.flexmedia.checkinhub.modules.metrics.dto;

import java.util.List;

public record DashboardDTO(
        long totalCheckinsHoje,
        long totalCheckoutsHoje,
        long totalChavesHoje,
        int ocupacaoAtual,
        long hoteisAtivos,
        List<MetricaDiaDTO> historico,
        long idiomaPt,
        long idiomaEn,
        long idiomaEs
) {
    public record MetricaDiaDTO(String data, int totalCheckins, int totalCheckouts, int totalChaves) {}
}
