using DuurzaamWoningKompas.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace DuurzaamWoningKompas.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<LeadProperty> LeadProperties => Set<LeadProperty>();
    public DbSet<EnergyProfile> EnergyProfiles => Set<EnergyProfile>();
    public DbSet<LeadInterest> LeadInterests => Set<LeadInterest>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<LeadSource> LeadSources => Set<LeadSource>();
    public DbSet<LeadStatusHistory> LeadStatusHistory => Set<LeadStatusHistory>();
    public DbSet<LeadNote> LeadNotes => Set<LeadNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresEnum<LeadStatus>();
        modelBuilder.HasPostgresEnum<ProductCategory>();

        modelBuilder.Entity<Lead>(entity =>
        {
            entity.ToTable("leads");
            entity.HasKey(lead => lead.Id);
            entity.Property(lead => lead.SubmissionId).HasMaxLength(80).IsRequired();
            entity.Property(lead => lead.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(lead => lead.ProductInterest).HasConversion<string>().HasMaxLength(60);
            entity.Property(lead => lead.FullName).HasMaxLength(180).IsRequired();
            entity.Property(lead => lead.Email).HasMaxLength(260).IsRequired();
            entity.Property(lead => lead.Phone).HasMaxLength(40);
            entity.Property(lead => lead.PrimaryGoal).HasMaxLength(120).IsRequired();
            entity.Property(lead => lead.DesiredStartTerm).HasMaxLength(80).IsRequired();
            entity.HasIndex(lead => lead.Status);
            entity.HasIndex(lead => lead.SubmissionId).IsUnique();
            entity.HasIndex(lead => lead.ProductInterest);
            entity.HasIndex(lead => lead.CreatedAt);
            entity.HasIndex(lead => lead.Email);

            entity.HasOne(lead => lead.Property).WithOne().HasForeignKey<LeadProperty>(property => property.LeadId);
            entity.HasOne(lead => lead.EnergyProfile).WithOne().HasForeignKey<EnergyProfile>(profile => profile.LeadId);
            entity.HasOne(lead => lead.Source).WithOne().HasForeignKey<LeadSource>(source => source.LeadId);
            entity.HasMany(lead => lead.Interests).WithOne().HasForeignKey(interest => interest.LeadId);
            entity.HasMany(lead => lead.ConsentRecords).WithOne().HasForeignKey(consent => consent.LeadId);
            entity.HasMany(lead => lead.StatusHistory).WithOne().HasForeignKey(history => history.LeadId);
            entity.HasMany(lead => lead.Notes).WithOne().HasForeignKey(note => note.LeadId);
        });

        modelBuilder.Entity<LeadProperty>(entity =>
        {
            entity.ToTable("lead_properties");
            entity.Property(property => property.HomeType).HasMaxLength(80).IsRequired();
            entity.Property(property => property.BuildYearRange).HasMaxLength(80).IsRequired();
            entity.Property(property => property.SolarPanels).HasMaxLength(40).IsRequired();
            entity.Property(property => property.Postcode).HasMaxLength(12).IsRequired();
            entity.Property(property => property.HouseNumber).HasMaxLength(20).IsRequired();
            entity.HasIndex(property => property.Postcode);
        });

        modelBuilder.Entity<EnergyProfile>(entity =>
        {
            entity.ToTable("energy_profiles");
            entity.Property(profile => profile.EnergyContractType).HasMaxLength(40);
        });

        modelBuilder.Entity<LeadInterest>(entity =>
        {
            entity.ToTable("lead_interests");
            entity.Property(interest => interest.Value).HasMaxLength(120).IsRequired();
            entity.HasIndex(interest => interest.Value);
        });

        modelBuilder.Entity<ConsentRecord>(entity =>
        {
            entity.ToTable("consent_records");
            entity.Property(consent => consent.ConsentText).HasMaxLength(1200).IsRequired();
            entity.Property(consent => consent.ConsentVersion).HasMaxLength(40).IsRequired();
            entity.Property(consent => consent.SourceUrl).HasMaxLength(600).IsRequired();
        });

        modelBuilder.Entity<LeadSource>(entity =>
        {
            entity.ToTable("lead_sources");
            entity.Property(source => source.UtmSource).HasMaxLength(160);
            entity.Property(source => source.UtmMedium).HasMaxLength(160);
            entity.Property(source => source.UtmCampaign).HasMaxLength(180);
            entity.Property(source => source.UtmTerm).HasMaxLength(180);
            entity.Property(source => source.UtmContent).HasMaxLength(240);
            entity.Property(source => source.Gclid).HasMaxLength(240);
            entity.Property(source => source.Referrer).HasMaxLength(600);
            entity.Property(source => source.LandingPage).HasMaxLength(600).IsRequired();
            entity.HasIndex(source => source.UtmSource);
            entity.HasIndex(source => source.UtmCampaign);
        });

        modelBuilder.Entity<LeadStatusHistory>(entity =>
        {
            entity.ToTable("lead_status_history");
            entity.Property(history => history.PreviousStatus).HasConversion<string>().HasMaxLength(40);
            entity.Property(history => history.NewStatus).HasConversion<string>().HasMaxLength(40);
            entity.Property(history => history.Actor).HasMaxLength(120).IsRequired();
            entity.Property(history => history.Note).HasMaxLength(800);
        });

        modelBuilder.Entity<LeadNote>(entity =>
        {
            entity.ToTable("lead_notes");
            entity.Property(note => note.Text).HasMaxLength(2000).IsRequired();
            entity.Property(note => note.Actor).HasMaxLength(120).IsRequired();
        });
    }
}
