using System.Security.Claims;

namespace CanteenManagement.API.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        public static int ResolveUserId(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? user.FindFirst("sub")?.Value
                        ?? user.FindFirst("UserId")?.Value;

            if (int.TryParse(claim, out var id))
            {
                return id;
            }
            return 0;
        }

        public static string ResolveUserName(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value
                   ?? user.FindFirst("unique_name")?.Value
                   ?? user.FindFirst("UserName")?.Value
                   ?? "System";
        }

        public static string ResolveUserRole(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Role)?.Value
                   ?? user.FindFirst("role")?.Value
                   ?? "Student";
        }

        public static int ResolveCampusId(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst("CampusId")?.Value
                        ?? user.FindFirst("campus_id")?.Value
                        ?? user.FindFirst("InstitutionId")?.Value
                        ?? user.FindFirst("institution_id")?.Value;

            if (int.TryParse(claim, out var campusId) && campusId > 0)
            {
                return campusId;
            }
            return 1; // Default campus
        }

        public static int ResolveInstitutionId(this ClaimsPrincipal user) => ResolveCampusId(user);
    }
}
