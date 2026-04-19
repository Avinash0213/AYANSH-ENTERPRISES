namespace BMS.Api.Middleware;

using BMS.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

public class RequirePermissionAttribute : TypeFilterAttribute
{
    public RequirePermissionAttribute(string permission) : base(typeof(PermissionFilter))
    {
        Arguments = new object[] { permission };
    }
}

public class PermissionFilter : IAsyncActionFilter
{
    private readonly IPermissionService _permService;
    private readonly string _permission;

    public PermissionFilter(IPermissionService permService, string permission)
    {
        _permService = permService;
        _permission = permission;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var userIdClaim = ctx.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            ctx.Result = new UnauthorizedResult();
            return;
        }

        var hasPermission = await _permService.HasPermissionAsync(int.Parse(userIdClaim.Value), _permission);

        if (!hasPermission)
        {
            ctx.Result = new ForbidResult();
            return;
        }

        await next();
    }
}
