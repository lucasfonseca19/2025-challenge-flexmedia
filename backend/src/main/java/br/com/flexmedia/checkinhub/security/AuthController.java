package br.com.flexmedia.checkinhub.security;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.security.dto.LoginRequestDTO;
import br.com.flexmedia.checkinhub.security.dto.LoginResponseDTO;
import br.com.flexmedia.checkinhub.security.dto.RegisterRequestDTO;
import br.com.flexmedia.checkinhub.security.dto.UsuarioInfoDTO;
import br.com.flexmedia.checkinhub.security.dto.UsuarioResponseDTO;
import br.com.flexmedia.checkinhub.security.jwt.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UsuarioRepository usuarioRepository;
    private final HotelRepository hotelRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public AuthController(AuthenticationManager authManager,
                          UsuarioRepository usuarioRepository,
                          HotelRepository hotelRepository,
                          JwtService jwtService,
                          PasswordEncoder passwordEncoder,
                          CurrentUserService currentUserService) {
        this.authManager = authManager;
        this.usuarioRepository = usuarioRepository;
        this.hotelRepository = hotelRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Usuario usuario = usuarioRepository.findByEmailAndAtivoTrue(request.email())
                .orElseThrow();

        String token = jwtService.gerarToken(
                usuario.getEmail(),
                usuario.getHotel() != null ? usuario.getHotel().getId() : null,
                usuario.getRole().name()
        );
        return ResponseEntity.ok(new LoginResponseDTO(token, UsuarioInfoDTO.from(usuario)));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new BusinessException("E-mail já cadastrado: " + request.email());
        }

        Hotel hotel = null;
        if (request.hotelId() != null) {
            hotel = hotelRepository.findById(request.hotelId())
                    .orElseThrow(() -> new BusinessException("Hotel não encontrado: " + request.hotelId()));
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .role(request.role())
                .hotel(hotel)
                .ativo(true)
                .build();

        usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponseDTO.from(usuario));
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsuarioResponseDTO>> listarUsuarios() {
        List<UsuarioResponseDTO> usuarios = usuarioRepository.findAll()
                .stream()
                .map(UsuarioResponseDTO::from)
                .toList();
        return ResponseEntity.ok(usuarios);
    }

    @DeleteMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desativarUsuario(@PathVariable Long id) {
        Usuario usuarioAtual = currentUserService.getCurrentUser();
        if (usuarioAtual.getId().equals(id)) {
            throw new BusinessException("Não é possível desativar o próprio usuário logado.");
        }

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado: " + id));
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
        return ResponseEntity.noContent().build();
    }
}
