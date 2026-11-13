using Asp.Versioning;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Services.Interfaces.Common;
using Microsoft.AspNetCore.Mvc;

namespace CanteenManagement.API.Controllers.V1
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/media")]
    public class MediaController : ControllerBase
    {
        private readonly IMediaStorageService _mediaStorageService;
        private readonly ILogger<MediaController> _logger;

        public MediaController(IMediaStorageService mediaStorageService, ILogger<MediaController> logger)
        {
            _mediaStorageService = mediaStorageService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] string folder = "menu")
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse("No file was uploaded. Please provide an image file under the 'file' field."));
            }

            try
            {
                var relativePath = await _mediaStorageService.SaveImageAsync(file, folder);
                var result = new
                {
                    fileUrl = relativePath,
                    fileName = Path.GetFileName(relativePath),
                    fileSizeBytes = file.Length,
                    contentType = file.ContentType
                };

                return Ok(ApiResponse<object>.SuccessResponse(result, "Image uploaded successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while uploading media file.");
                return StatusCode(500, ApiResponse<string>.ErrorResponse("An error occurred while uploading the file."));
            }
        }
    }
}

