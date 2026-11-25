using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CanteenManagement.API.Models.Auth;
using Microsoft.IdentityModel.Tokens;

namespace CanteenManagement.API.Helpers
{
    public interface IJwtTokenHelper
    {
        string GenerateToken(User user, int? outletId = null);
    }

    public class JwtTokenHelper : IJwtTokenHelper
    {
        private readonly IConfiguration _configuration;

        public JwtTokenHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, int? outletId = null)
        {
            var keyString = _configuration["Jwt:Key"] ?? "CanteenManagementSecretKeyMustBe32CharsLongForSecurity123!";
            var issuer = _configuration["Jwt:Issuer"] ?? "CanteenManagementAPI";
            var audience = _configuration["Jwt:Audience"] ?? "CanteenManagementClients";
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var exp) ? exp : 1440; // Default 24 hrs

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("CampusId", user.CampusId.ToString()),
                new Claim("InstitutionId", user.CampusId.ToString()),
                new Claim("FullName", user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if (outletId.HasValue && outletId.Value > 0)
            {
                claims.Add(new Claim("OutletId", outletId.Value.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

