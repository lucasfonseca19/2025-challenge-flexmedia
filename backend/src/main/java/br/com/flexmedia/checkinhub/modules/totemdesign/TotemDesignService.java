package br.com.flexmedia.checkinhub.modules.totemdesign;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemDesignDTO;
import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemMediaAssetDTO;
import br.com.flexmedia.checkinhub.security.RoleUsuario;
import br.com.flexmedia.checkinhub.security.Usuario;
import br.com.flexmedia.checkinhub.security.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TotemDesignService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4");
    private static final long IMAGE_LIMIT = 8L * 1024 * 1024;
    private static final long VIDEO_LIMIT = 80L * 1024 * 1024;

    private final TotemDesignRepository designRepository;
    private final TotemMediaAssetRepository mediaRepository;
    private final HotelRepository hotelRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    public TotemDesignDTO buscarDraft(Long hotelId) {
        Hotel hotel = hotelAutorizado(hotelId);
        TotemDesign design = designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(hotelId, TotemDesignStatus.DRAFT)
                .orElseGet(() -> criarDesignPadrao(hotel));
        return TotemDesignDTO.from(design, objectMapper);
    }

    public TotemDesignDTO salvarDraft(Long hotelId, TotemDesignDTO dto) {
        Hotel hotel = hotelAutorizado(hotelId);
        TotemDesign design = designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(hotelId, TotemDesignStatus.DRAFT)
                .orElseGet(() -> TotemDesign.builder().hotel(hotel).status(TotemDesignStatus.DRAFT).build());

        design.setTheme(toJson(dto.theme()));
        design.setLayout(toJson(dto.layout()));
        design.setBlocks(toJson(dto.blocks()));
        return TotemDesignDTO.from(designRepository.save(design), objectMapper);
    }

    public TotemDesignDTO publicar(Long hotelId) {
        hotelAutorizado(hotelId);
        TotemDesign draft = designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(hotelId, TotemDesignStatus.DRAFT)
                .orElseThrow(() -> new ResourceNotFoundException("Rascunho de design não encontrado."));

        TotemDesign published = designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(hotelId, TotemDesignStatus.PUBLISHED)
                .orElseGet(() -> TotemDesign.builder().hotel(draft.getHotel()).status(TotemDesignStatus.PUBLISHED).build());
        published.setTheme(draft.getTheme());
        published.setLayout(draft.getLayout());
        published.setBlocks(draft.getBlocks());
        published.setUpdatedAt(LocalDateTime.now());
        return TotemDesignDTO.from(designRepository.save(published), objectMapper);
    }

    public TotemDesignDTO buscarPublicado(Long hotelId) {
        return designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(hotelId, TotemDesignStatus.PUBLISHED)
                .map(design -> TotemDesignDTO.from(design, objectMapper))
                .orElse(null);
    }

    public List<TotemMediaAssetDTO> listarMidias(Long hotelId) {
        hotelAutorizado(hotelId);
        return mediaRepository.findByHotelIdOrderByCreatedAtDesc(hotelId)
                .stream()
                .map(TotemMediaAssetDTO::from)
                .toList();
    }

    public TotemMediaAssetDTO upload(Long hotelId, MultipartFile file) {
        Hotel hotel = hotelAutorizado(hotelId);
        validarArquivo(file);

        String mimeType = file.getContentType();
        String extension = extensao(file.getOriginalFilename(), mimeType);
        String storedName = UUID.randomUUID() + extension;
        Path hotelDir = Path.of(uploadsDir, "totem", String.valueOf(hotelId));
        Path target = hotelDir.resolve(storedName).normalize();

        try {
            Files.createDirectories(hotelDir);
            file.transferTo(target);
        } catch (IOException e) {
            throw new BusinessException("Não foi possível salvar a mídia.");
        }

        Integer width = null;
        Integer height = null;
        if (IMAGE_TYPES.contains(mimeType)) {
            try {
                var image = ImageIO.read(target.toFile());
                if (image != null) {
                    width = image.getWidth();
                    height = image.getHeight();
                }
            } catch (IOException ignored) {
                width = null;
                height = null;
            }
        }

        TotemMediaAsset asset = TotemMediaAsset.builder()
                .hotel(hotel)
                .originalName(file.getOriginalFilename() == null ? storedName : file.getOriginalFilename())
                .storedName(storedName)
                .mimeType(mimeType)
                .sizeBytes(file.getSize())
                .publicUrl("/uploads/totem/" + hotelId + "/" + storedName)
                .width(width)
                .height(height)
                .build();

        return TotemMediaAssetDTO.from(mediaRepository.save(asset));
    }

    public void removerMidia(Long hotelId, Long assetId) {
        hotelAutorizado(hotelId);
        TotemMediaAsset asset = mediaRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Mídia não encontrada."));
        if (!asset.getHotel().getId().equals(hotelId)) {
            throw new ResourceNotFoundException("Mídia não encontrada.");
        }
        try {
            Files.deleteIfExists(Path.of(uploadsDir, "totem", String.valueOf(hotelId), asset.getStoredName()));
        } catch (IOException ignored) {
        }
        mediaRepository.delete(asset);
    }

    private TotemDesign criarDesignPadrao(Hotel hotel) {
        TotemDesign design = TotemDesign.builder()
                .hotel(hotel)
                .status(TotemDesignStatus.DRAFT)
                .theme("""
                        {"brandName":"CheckIn Hub","primaryColor":"#0f766e","backgroundColor":"#f8fafc","textColor":"#10201d","surfaceColor":"#ffffff","fontFamily":"Satoshi"}
                        """)
                .layout("""
                        {"template":"lobby-elegante","density":"comfortable","screen":"portrait"}
                        """)
                .blocks("""
                        [{"id":"hero","type":"hero","visible":true,"title":"Boas-vindas","subtitle":"Toque para iniciar seu atendimento","alignment":"left","variant":"imageSplit","backgroundColor":"#f8fafc"},{"id":"actions","type":"cta","visible":true,"title":"Comece por aqui","subtitle":"Check-in e check-out em poucos passos","variant":"dual"},{"id":"amenities","type":"amenities","visible":true,"title":"Durante sua estadia","items":["Wi-Fi de alta velocidade","Restaurante aberto até 23h","Equipe disponível 24h"],"variant":"tiles"},{"id":"footer","type":"footer","visible":true,"title":"CheckIn Hub","subtitle":"Bem-vindo, Welcome, Bienvenido"}]
                        """)
                .build();
        return designRepository.save(design);
    }

    private Hotel hotelAutorizado(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));
        Usuario usuario = usuarioAtual();
        if (usuario.getRole() != RoleUsuario.ADMIN
                && (usuario.getHotel() == null || !usuario.getHotel().getId().equals(hotelId))) {
            throw new BusinessException("Usuário não autorizado para este hotel.");
        }
        return hotel;
    }

    private Usuario usuarioAtual() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmailAndAtivoTrue(email)
                .orElseThrow(() -> new BusinessException("Usuário autenticado não encontrado."));
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new BusinessException("JSON de design inválido.");
        }
    }

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo obrigatório.");
        }
        String mimeType = file.getContentType();
        if (!IMAGE_TYPES.contains(mimeType) && !VIDEO_TYPES.contains(mimeType)) {
            throw new BusinessException("Tipo de mídia não permitido.");
        }
        long limit = IMAGE_TYPES.contains(mimeType) ? IMAGE_LIMIT : VIDEO_LIMIT;
        if (file.getSize() > limit) {
            throw new BusinessException("Arquivo excede o limite permitido.");
        }
    }

    private String extensao(String fileName, String mimeType) {
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        }
        return switch (mimeType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            default -> "";
        };
    }
}
