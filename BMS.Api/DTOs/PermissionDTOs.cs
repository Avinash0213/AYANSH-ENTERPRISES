namespace BMS.Api.DTOs;

public class GrantRevokeRequest
{
    public int UserId { get; set; }
    public int PermissionId { get; set; }
}

public class UserPermissionResponse
{
    public int PermissionId { get; set; }
    public string PermissionName { get; set; } = null!;
    public bool IsGranted { get; set; }
    public string Source { get; set; } = null!; // "Role" or "UserOverride"
}

public class PermissionResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}
