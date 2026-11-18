namespace CanteenManagement.API.Services.Interfaces.Common;

public interface IMediaStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string subFolder = "menu");
    bool DeleteImage(string relativePath);
}

