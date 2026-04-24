package br.com.flexmedia.checkinhub.modules.checkin;

import java.time.LocalDate;

public record CheckinConfirmDTO(String faceDescriptor, LocalDate dataNascimento, String idioma) {}
