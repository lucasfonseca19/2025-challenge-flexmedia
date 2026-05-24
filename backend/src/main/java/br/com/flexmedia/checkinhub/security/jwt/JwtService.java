package br.com.flexmedia.checkinhub.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String gerarToken(String email) {
        return gerarToken(email, null, null);
    }

    public String gerarToken(String email, Long hotelId, String role) {
        long agora = System.currentTimeMillis();
        return Jwts.builder()
                .subject(email)
                .claim("hotelId", hotelId)
                .claim("role", role)
                .issuedAt(new Date(agora))
                .expiration(new Date(agora + jwtProperties.getExpirationMs()))
                .signWith(getKey())
                .compact();
    }

    public Long extrairHotelId(String token) {
        Object hotelId = extrairClaims(token).get("hotelId");
        return hotelId != null ? Long.valueOf(hotelId.toString()) : null;
    }

    public String extrairRole(String token) {
        return (String) extrairClaims(token).get("role");
    }

    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public boolean isTokenValido(String token, String email) {
        try {
            String emailToken = extrairEmail(token);
            return emailToken.equals(email) && !isExpirado(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Token JWT invalido: {}", e.getMessage());
            return false;
        }
    }

    private boolean isExpirado(String token) {
        return extrairClaims(token).getExpiration().before(new Date());
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
