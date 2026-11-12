using System.ComponentModel.DataAnnotations;

namespace CanteenManagement.API.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Institution ID is required.")]
        public int InstitutionId { get; set; } = 1;

        [Required(ErrorMessage = "Username is required.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full Name is required.")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        [RegularExpression("^(Student|Faculty|Staff|Admin)$", ErrorMessage = "Role must be Student, Faculty, Staff, or Admin.")]
        public string Role { get; set; } = "Student";

        [Phone(ErrorMessage = "Invalid phone number.")]
        public string? PhoneNumber { get; set; }
    }
}

