namespace BMS.Api.Domain.Entities;

public class Agent
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
}
