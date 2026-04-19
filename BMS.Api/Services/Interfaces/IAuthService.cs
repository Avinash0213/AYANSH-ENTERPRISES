namespace BMS.Api.Services.Interfaces;
using BMS.Api.DTOs;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
}
