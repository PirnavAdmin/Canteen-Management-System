using CanteenManagement.API.Services.Interfaces.Common;

namespace CanteenManagement.API.Services.Implementations.Common;

public class MediaStorageService : IMediaStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<MediaStorageService> _logger;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".jfif", ".avif", ".svg"
    };
    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10 MB

    public MediaStorageService(IWebHostEnvironment environment, ILogger<MediaStorageService> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async Task<string> SaveImageAsync(IFormFile file, string subFolder = "menu")
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No image file provided or file is empty.");
        }

        if (file.Length > MaxFileSizeInBytes)
        {
            throw new ArgumentException($"File size exceeds maximum allowed limit of {MaxFileSizeInBytes / (1024 * 1024)}MB.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension))
        {
            extension = file.ContentType?.ToLowerInvariant() switch
            {
                "image/jpeg" or "image/jpg" or "image/pjpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/avif" => ".avif",
                "image/svg+xml" => ".svg",
                _ => ".jpg"
            };
        }

        if (!AllowedExtensions.Contains(extension))
        {
            throw new ArgumentException($"Unsupported file format '{extension}'. Allowed formats: {string.Join(", ", AllowedExtensions)}");
        }

        // Clean subFolder name to avoid path traversal
        var safeSubFolder = string.Join("_", subFolder.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries)).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(safeSubFolder))
        {
            safeSubFolder = "menu";
        }

        var uploadsRoot = Path.Combine(_environment.ContentRootPath, "uploads", safeSubFolder);
        if (!Directory.Exists(uploadsRoot))
        {
            Directory.CreateDirectory(uploadsRoot);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsRoot, uniqueFileName);

        using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        _logger.LogInformation("Saved media file {FileName} to {PhysicalPath}", uniqueFileName, physicalPath);

        // Auto-mirror to sister backend project uploads folder so both solutions stay 100% in sync
        try
        {
            var altPath1 = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", "..", "Canteen Management", "uploads", safeSubFolder));
            var altPath2 = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", "src", "CanteenManagement.API", "uploads", safeSubFolder));
            var targetAlt = Directory.Exists(Path.GetDirectoryName(altPath1)!) ? altPath1 : (Directory.Exists(Path.GetDirectoryName(altPath2)!) ? altPath2 : null);
            if (targetAlt != null && !string.Equals(targetAlt, uploadsRoot, StringComparison.OrdinalIgnoreCase))
            {
                if (!Directory.Exists(targetAlt)) Directory.CreateDirectory(targetAlt);
                File.Copy(physicalPath, Path.Combine(targetAlt, uniqueFileName), true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Sister project mirror skipped: {Message}", ex.Message);
        }

        // Return relative web path with forward slashes
        return $"/uploads/{safeSubFolder}/{uniqueFileName}";
    }

    public bool DeleteImage(string relativePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return false;

            var cleanPath = relativePath.TrimStart('/').Replace('\\', '/');
            if (!cleanPath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var physicalPath = Path.Combine(_environment.ContentRootPath, cleanPath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
                _logger.LogInformation("Deleted media file at {PhysicalPath}", physicalPath);
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image at {RelativePath}", relativePath);
        }

        return false;
    }
}

