namespace BMS.Api.Services.Interfaces;

public interface IPermissionService
{
    Task<bool> HasPermissionAsync(int userId, string permissionName);
}
