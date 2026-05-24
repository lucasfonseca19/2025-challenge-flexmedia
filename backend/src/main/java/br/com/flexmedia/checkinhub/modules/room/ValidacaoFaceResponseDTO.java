package br.com.flexmedia.checkinhub.modules.room;

public record ValidacaoFaceResponseDTO(
        boolean sucesso,
        String mensagem,
        String descriptorArmazenado,
        String hospedeNome,
        String quartoNumero
) {
    public ValidacaoFaceResponseDTO(boolean sucesso, String mensagem) {
        this(sucesso, mensagem, null, null, null);
    }
}
