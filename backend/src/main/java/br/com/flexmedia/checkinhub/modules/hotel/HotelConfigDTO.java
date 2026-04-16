package br.com.flexmedia.checkinhub.modules.hotel;

public record HotelConfigDTO(
        Long id,
        Long hotelId,
        String nomeExibido,
        String logoUrl,
        String corPrimaria,
        String idiomasAtivos
) {
    public static HotelConfigDTO from(HotelConfig c) {
        return new HotelConfigDTO(
                c.getId(),
                c.getHotel().getId(),
                c.getNomeExibido(),
                c.getLogoUrl(),
                c.getCorPrimaria(),
                c.getIdiomasAtivos()
        );
    }
}
