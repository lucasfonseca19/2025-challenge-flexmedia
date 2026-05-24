package br.com.flexmedia.checkinhub.modules.hotel;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class ReservaCodeGenerator {

    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int TAMANHO = 6;

    private final SecureRandom random = new SecureRandom();

    public String gerarCodigo() {
        StringBuilder codigo = new StringBuilder(TAMANHO);
        for (int i = 0; i < TAMANHO; i++) {
            codigo.append(ALFABETO.charAt(random.nextInt(ALFABETO.length())));
        }
        return codigo.toString();
    }
}
