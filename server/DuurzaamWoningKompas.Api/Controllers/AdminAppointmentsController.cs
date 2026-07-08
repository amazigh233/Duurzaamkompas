using DuurzaamWoningKompas.Api.Data;
using DuurzaamWoningKompas.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/admin/appointments")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminAppointmentsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(AppointmentResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AppointmentResponse>>> GetAppointments(
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Appointments
            .AsNoTracking()
            .Include(appointment => appointment.Lead)
            .AsQueryable();

        if (from.HasValue)
        {
            query = query.Where(appointment => appointment.StartAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(appointment => appointment.StartAt < to.Value);
        }

        var appointments = await query
            .OrderBy(appointment => appointment.StartAt)
            .Take(200)
            .Select(appointment => new AppointmentResponse(
                appointment.Id,
                appointment.LeadId,
                appointment.Lead.FullName,
                appointment.Lead.ProductInterest,
                appointment.StartAt,
                appointment.EndAt,
                appointment.Type,
                appointment.Status,
                appointment.Notes))
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }
}
