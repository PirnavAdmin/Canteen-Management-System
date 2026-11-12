namespace CanteenManagement.API.Helpers
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public int StatusCode { get; set; } = 200;

        public static ApiResponse<T> Ok(T data, string message = "Success", int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = statusCode
            };
        }

        public static ApiResponse<T> Fail(string message, List<string>? errors = null, int statusCode = 400)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                Errors = errors ?? new List<string>(),
                StatusCode = statusCode
            };
        }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Success", int statusCode = 200)
        {
            return Ok(data, message, statusCode);
        }

        public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null, int statusCode = 400)
        {
            return Fail(message, errors, statusCode);
        }
    }

    public class ApiResponse : ApiResponse<object>
    {
        public static ApiResponse Ok(string message = "Success", int statusCode = 200)
        {
            return new ApiResponse
            {
                Success = true,
                Message = message,
                Data = null,
                StatusCode = statusCode
            };
        }

        public new static ApiResponse Fail(string message, List<string>? errors = null, int statusCode = 400)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message,
                Data = null,
                Errors = errors ?? new List<string>(),
                StatusCode = statusCode
            };
        }

        public new static ApiResponse SuccessResponse(object data, string message = "Success", int statusCode = 200)
        {
            return new ApiResponse
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = statusCode
            };
        }

        public new static ApiResponse ErrorResponse(string message, List<string>? errors = null, int statusCode = 400)
        {
            return Fail(message, errors, statusCode);
        }
    }
}
