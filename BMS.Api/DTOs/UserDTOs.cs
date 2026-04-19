namespace BMS.Api.DTOs;

public class CreateUserRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public int RoleId { get; set; }
}

public class UpdateUserRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int RoleId { get; set; }
    public string? Password { get; set; } // Only update if provided
}

public class UserResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public bool IsDeleted { get; set; }
}

public class UpdateProfileRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Password { get; set; }
}
