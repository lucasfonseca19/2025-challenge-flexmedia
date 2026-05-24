package br.com.flexmedia.checkinhub.modules.hotel;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReservaCodeGeneratorTest {

    private final ReservaCodeGenerator generator = new ReservaCodeGenerator();

    @Test
    void gerarCodigo_retornaAteSeisCaracteresAlfanumericosSemHifen() {
        String codigo = generator.gerarCodigo();

        assertThat(codigo).matches("^[A-Z0-9]{1,6}$");
    }
}
