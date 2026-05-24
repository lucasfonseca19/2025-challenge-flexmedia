package br.com.flexmedia.checkinhub.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UsuarioRepository usuarioRepository;

    public Usuario getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Usuário não autenticado.");
        }

        return usuarioRepository.findByEmailAndAtivoTrue(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Usuário autenticado não encontrado."));
    }

    public boolean isAdmin(Usuario usuario) {
        return usuario.getRole() == RoleUsuario.ADMIN;
    }

    public Long getOperatorHotelId(Usuario usuario) {
        if (usuario.getHotel() == null) {
            throw new AccessDeniedException("Operador não está vinculado a um hotel.");
        }
        return usuario.getHotel().getId();
    }
}
