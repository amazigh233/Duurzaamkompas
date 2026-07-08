using Microsoft.AspNetCore.Mvc;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("openapi")]
public sealed class OpenApiController : ControllerBase
{
    [HttpGet("/swagger")]
    public ContentResult Swagger()
    {
        const string html = """
            <!doctype html>
            <html lang="nl">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>DuurzaamWoningKompas API</title>
                <style>
                  body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f7f8f3;color:#1e2925}
                  main{max-width:760px;margin:0 auto;padding:48px 24px}
                  a{color:#163d32;font-weight:800}
                  code{background:#fff;border:1px solid #dfe5d7;border-radius:6px;padding:2px 6px}
                </style>
              </head>
              <body>
                <main>
                  <h1>DuurzaamWoningKompas API</h1>
                  <p>De OpenAPI-specificatie is beschikbaar als JSON.</p>
                  <p><a href="/openapi/v1.json">Open <code>/openapi/v1.json</code></a></p>
                  <p>Admin endpoints gebruiken een server-side sessiecookie via <code>POST /api/admin/session</code>.</p>
                </main>
              </body>
            </html>
            """;

        return Content(html, "text/html");
    }

    [HttpGet("v1.json")]
    public IActionResult Get()
    {
        return Ok(new
        {
            openapi = "3.0.3",
            info = new
            {
                title = "DuurzaamWoningKompas API",
                version = "v1",
                description = "API voor Woningcheck leadopslag, consentregistratie en admin leadbeheer."
            },
            paths = new Dictionary<string, object>
            {
                ["/api/health"] = new
                {
                    get = new
                    {
                        summary = "Controleer API health",
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("API is bereikbaar", "HealthResponse")
                        }
                    }
                },
                ["/api/admin/session"] = new
                {
                    get = new
                    {
                        summary = "Controleer admin-sessie",
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Admin sessie", "AdminSessionResponse")
                        }
                    },
                    post = new
                    {
                        summary = "Log in als admin",
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("AdminLoginRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Admin sessie", "AdminSessionResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-inloggegevens", "ApiError")
                        }
                    },
                    delete = new
                    {
                        summary = "Log uit als admin",
                        responses = new Dictionary<string, object>
                        {
                            ["204"] = new { description = "Uitgelogd" }
                        }
                    }
                },
                ["/api/woningcheck/leads"] = new
                {
                    post = new
                    {
                        summary = "Sla een Woningcheck-lead op",
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("CreateLeadRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["201"] = JsonResponse("Lead opgeslagen", "LeadCreatedResponse"),
                            ["400"] = JsonResponse("Validatiefout", "ApiError")
                        }
                    }
                },
                ["/api/contact/messages"] = new
                {
                    post = new
                    {
                        summary = "Verstuur een contactbericht",
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("ContactMessageRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["204"] = new { description = "Contactbericht verzonden" },
                            ["400"] = JsonResponse("Validatiefout", "ApiError"),
                            ["429"] = JsonResponse("Te veel contactpogingen", "ApiError"),
                            ["503"] = JsonResponse("Contactnotificatie niet beschikbaar", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads"] = new
                {
                    get = new
                    {
                        summary = "Zoek en filter leads",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new object[]
                        {
                            QueryParameter("query", "Vrij zoeken op naam, e-mail, postcode of doel."),
                            QueryParameter("status", "Filter op leadstatus.", "LeadStatus"),
                            QueryParameter("product", "Filter op productinteresse.", "ProductCategory"),
                            QueryParameter("source", "Filter op UTM-bron, medium of referrer."),
                            QueryParameter("campaign", "Filter op UTM-campagne."),
                            QueryParameter("from", "Filter vanaf datum.", "date"),
                            QueryParameter("to", "Filter tot en met datum.", "date"),
                            QueryParameter("sort", "Sorteeroptie.", "LeadSortOption"),
                            QueryParameter("page", "Paginanummer.", "integer"),
                            QueryParameter("pageSize", "Aantal per pagina.", "integer")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Gepagineerde leadlijst", "PagedLeadListResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-toegang", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/metrics"] = new
                {
                    get = new
                    {
                        summary = "Bekijk dashboard-kerncijfers voor leads",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Dashboard-kerncijfers", "AdminLeadMetricsResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-toegang", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/dashboard"] = new
                {
                    get = new
                    {
                        summary = "Bekijk CRM dashboarddata",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("CRM dashboard", "AdminDashboardResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-toegang", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/report"] = new
                {
                    get = new
                    {
                        summary = "Bekijk CRM rapportage",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("CRM rapportage", "AdminReportResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-toegang", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/{id}"] = new
                {
                    get = new
                    {
                        summary = "Bekijk lead detail",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new[] { PathParameter("id", "Lead id.") },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Lead detail", "LeadDetailResponse"),
                            ["404"] = JsonResponse("Lead niet gevonden", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/{id}/status"] = new
                {
                    patch = new
                    {
                        summary = "Wijzig leadstatus",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new[] { PathParameter("id", "Lead id.") },
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("UpdateLeadStatusRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Status gewijzigd", "LeadDetailResponse"),
                            ["400"] = JsonResponse("Ongeldige statuswijziging", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/{id}/follow-up"] = new
                {
                    patch = new
                    {
                        summary = "Plan of wis leadopvolging",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new[] { PathParameter("id", "Lead id.") },
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("UpdateLeadFollowUpRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = JsonResponse("Follow-up bijgewerkt", "LeadDetailResponse"),
                            ["404"] = JsonResponse("Lead niet gevonden", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/{id}/notes"] = new
                {
                    post = new
                    {
                        summary = "Voeg interne notitie toe",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new[] { PathParameter("id", "Lead id.") },
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("AddLeadNoteRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["201"] = JsonResponse("Notitie toegevoegd", "LeadDetailResponse"),
                            ["400"] = JsonResponse("Validatiefout", "ApiError")
                        }
                    }
                },
                ["/api/admin/leads/{id}/appointments"] = new
                {
                    post = new
                    {
                        summary = "Plan een afspraak voor een lead",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new[] { PathParameter("id", "Lead id.") },
                        requestBody = new
                        {
                            required = true,
                            content = JsonContent("CreateAppointmentRequest")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["201"] = JsonResponse("Afspraak gepland", "LeadDetailResponse"),
                            ["400"] = JsonResponse("Validatiefout", "ApiError")
                        }
                    }
                },
                ["/api/admin/appointments"] = new
                {
                    get = new
                    {
                        summary = "Bekijk interne afspraken",
                        security = new[] { new Dictionary<string, string[]> { ["AdminCookie"] = [] } },
                        parameters = new object[]
                        {
                            QueryParameter("from", "Vanaf datum/tijd.", "date"),
                            QueryParameter("to", "Tot datum/tijd.", "date")
                        },
                        responses = new Dictionary<string, object>
                        {
                            ["200"] = ArrayJsonResponse("Afspraken", "AppointmentResponse"),
                            ["401"] = JsonResponse("Geen geldige admin-toegang", "ApiError")
                        }
                    }
                }
            },
            components = new
            {
                securitySchemes = new Dictionary<string, object>
                {
                    ["AdminCookie"] = new
                    {
                        type = "apiKey",
                        @in = "cookie",
                        name = "dwk-admin-session"
                    }
                },
                schemas = new Dictionary<string, object>
                {
                    ["HealthResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["status"] = StringSchema()
                    }),
                    ["AdminLoginRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["username"] = StringSchema(),
                        ["password"] = StringSchema()
                    }),
                    ["AdminSessionResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["authenticated"] = BooleanSchema(),
                        ["username"] = StringSchema()
                    }),
                    ["LeadStatus"] = EnumSchema(["New", "Contacted", "AppointmentScheduled", "QuoteCreated", "Won", "Lost"]),
                    ["LeadSortOption"] = EnumSchema(["Newest", "Oldest", "LastContact", "NextFollowUp"]),
                    ["ProductCategory"] = EnumSchema(["General", "Thuisbatterij", "Warmtepomp", "Isolatie", "Zonnepanelen", "Laadpaal", "Airconditioning", "Energieadvies"]),
                    ["CreateLeadRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["submissionId"] = StringSchema(),
                        ["productInterest"] = RefSchema("ProductCategory"),
                        ["woningtype"] = StringSchema(),
                        ["bouwjaar"] = StringSchema(),
                        ["zonnepanelen"] = StringSchema(),
                        ["aantalZonnepanelen"] = IntegerSchema(),
                        ["stroomverbruik"] = IntegerSchema(),
                        ["terugleveringKwh"] = IntegerSchema(),
                        ["energiecontract"] = StringSchema(),
                        ["gasverbruik"] = IntegerSchema(),
                        ["interesses"] = ArraySchema(StringSchema()),
                        ["hoofddoel"] = StringSchema(),
                        ["starttermijn"] = StringSchema(),
                        ["postcode"] = StringSchema(),
                        ["huisnummer"] = StringSchema(),
                        ["naam"] = StringSchema(),
                        ["email"] = StringSchema("email"),
                        ["telefoon"] = StringSchema(),
                        ["consent"] = RefSchema("ConsentRequest"),
                        ["tracking"] = RefSchema("TrackingRequest")
                    }),
                    ["ConsentRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["adviceConsent"] = BooleanSchema(),
                        ["matchingConsent"] = BooleanSchema(),
                        ["consentText"] = StringSchema(),
                        ["consentVersion"] = StringSchema(),
                        ["sourceUrl"] = StringSchema("uri")
                    }),
                    ["TrackingRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["utmSource"] = StringSchema(),
                        ["utmMedium"] = StringSchema(),
                        ["utmCampaign"] = StringSchema(),
                        ["utmTerm"] = StringSchema(),
                        ["utmContent"] = StringSchema(),
                        ["gclid"] = StringSchema(),
                        ["referrer"] = StringSchema("uri"),
                        ["landingPage"] = StringSchema("uri")
                    }),
                    ["ContactMessageRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["name"] = StringSchema(),
                        ["email"] = StringSchema("email"),
                        ["phone"] = StringSchema(),
                        ["subject"] = StringSchema(),
                        ["message"] = StringSchema(),
                        ["privacyConsent"] = BooleanSchema(),
                        ["sourceUrl"] = StringSchema("uri"),
                        ["honeypot"] = StringSchema()
                    }),
                    ["LeadCreatedResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["id"] = StringSchema("uuid"),
                        ["status"] = RefSchema("LeadStatus"),
                        ["createdAt"] = StringSchema("date-time")
                    }),
                    ["LeadListItemResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["id"] = StringSchema("uuid"),
                        ["status"] = RefSchema("LeadStatus"),
                        ["productInterest"] = RefSchema("ProductCategory"),
                        ["fullName"] = StringSchema(),
                        ["email"] = StringSchema("email"),
                        ["phone"] = StringSchema(),
                        ["postcode"] = StringSchema(),
                        ["primaryGoal"] = StringSchema(),
                        ["desiredStartTerm"] = StringSchema(),
                        ["utmSource"] = StringSchema(),
                        ["utmMedium"] = StringSchema(),
                        ["utmCampaign"] = StringSchema(),
                        ["lastContactAt"] = StringSchema("date-time"),
                        ["nextFollowUpAt"] = StringSchema("date-time"),
                        ["followUpNote"] = StringSchema(),
                        ["createdAt"] = StringSchema("date-time")
                    }),
                    ["PagedLeadListResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["items"] = ArraySchema(RefSchema("LeadListItemResponse")),
                        ["total"] = IntegerSchema(),
                        ["page"] = IntegerSchema(),
                        ["pageSize"] = IntegerSchema()
                    }),
                    ["LeadDetailResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["id"] = StringSchema("uuid"),
                        ["status"] = RefSchema("LeadStatus"),
                        ["productInterest"] = RefSchema("ProductCategory"),
                        ["fullName"] = StringSchema(),
                        ["email"] = StringSchema("email"),
                        ["phone"] = StringSchema(),
                        ["primaryGoal"] = StringSchema(),
                        ["desiredStartTerm"] = StringSchema(),
                        ["lastContactAt"] = StringSchema("date-time"),
                        ["nextFollowUpAt"] = StringSchema("date-time"),
                        ["followUpNote"] = StringSchema(),
                        ["createdAt"] = StringSchema("date-time"),
                        ["updatedAt"] = StringSchema("date-time"),
                        ["property"] = ObjectSchema(new Dictionary<string, object>()),
                        ["energyProfile"] = ObjectSchema(new Dictionary<string, object>()),
                        ["interests"] = ArraySchema(StringSchema()),
                        ["consentRecords"] = ArraySchema(ObjectSchema(new Dictionary<string, object>())),
                        ["source"] = RefSchema("TrackingRequest"),
                        ["statusHistory"] = ArraySchema(ObjectSchema(new Dictionary<string, object>())),
                        ["notes"] = ArraySchema(ObjectSchema(new Dictionary<string, object>())),
                        ["appointments"] = ArraySchema(RefSchema("AppointmentResponse"))
                    }),
                    ["AdminLeadMetricsResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["newLeads"] = IntegerSchema(),
                        ["leadsToday"] = IntegerSchema(),
                        ["leadsThisWeek"] = IntegerSchema(),
                        ["activeLeads"] = IntegerSchema(),
                        ["toCall"] = IntegerSchema(),
                        ["contactRate"] = NumberSchema(),
                        ["appointments"] = IntegerSchema(),
                        ["quotes"] = IntegerSchema(),
                        ["won"] = IntegerSchema(),
                        ["lost"] = IntegerSchema(),
                        ["wonConversionRate"] = NumberSchema()
                    }),
                    ["DashboardBucketResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["label"] = StringSchema(),
                        ["count"] = IntegerSchema()
                    }),
                    ["AdminDashboardResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["metrics"] = RefSchema("AdminLeadMetricsResponse"),
                        ["recentLeads"] = ArraySchema(RefSchema("LeadListItemResponse")),
                        ["leadsPerStatus"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerSource"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["openFollowUps"] = ArraySchema(RefSchema("LeadListItemResponse"))
                    }),
                    ["AdminReportResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["leadsPerDay"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerWeek"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerMonth"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerProduct"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerSource"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["leadsPerCampaign"] = ArraySchema(RefSchema("DashboardBucketResponse")),
                        ["appointments"] = IntegerSchema(),
                        ["quotes"] = IntegerSchema(),
                        ["won"] = IntegerSchema(),
                        ["lost"] = IntegerSchema(),
                        ["conversionRate"] = NumberSchema()
                    }),
                    ["AppointmentResponse"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["id"] = StringSchema("uuid"),
                        ["leadId"] = StringSchema("uuid"),
                        ["leadName"] = StringSchema(),
                        ["productInterest"] = RefSchema("ProductCategory"),
                        ["startAt"] = StringSchema("date-time"),
                        ["endAt"] = StringSchema("date-time"),
                        ["type"] = StringSchema(),
                        ["status"] = StringSchema(),
                        ["notes"] = StringSchema()
                    }),
                    ["UpdateLeadStatusRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["status"] = RefSchema("LeadStatus"),
                        ["note"] = StringSchema()
                    }),
                    ["UpdateLeadFollowUpRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["nextFollowUpAt"] = StringSchema("date-time"),
                        ["note"] = StringSchema()
                    }),
                    ["CreateAppointmentRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["startAt"] = StringSchema("date-time"),
                        ["endAt"] = StringSchema("date-time"),
                        ["type"] = StringSchema(),
                        ["status"] = StringSchema(),
                        ["notes"] = StringSchema()
                    }),
                    ["AddLeadNoteRequest"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["text"] = StringSchema()
                    }),
                    ["ApiError"] = ObjectSchema(new Dictionary<string, object>
                    {
                        ["code"] = StringSchema(),
                        ["message"] = StringSchema()
                    })
                }
            }
        });
    }

    private static object JsonContent(string schemaName)
    {
        return new Dictionary<string, object>
        {
            ["application/json"] = new
            {
                schema = RefSchema(schemaName)
            }
        };
    }

    private static object JsonResponse(string description, string schemaName)
    {
        return new
        {
            description,
            content = JsonContent(schemaName)
        };
    }

    private static object ArrayJsonResponse(string description, string schemaName)
    {
        return new
        {
            description,
            content = new Dictionary<string, object>
            {
                ["application/json"] = new
                {
                    schema = ArraySchema(RefSchema(schemaName))
                }
            }
        };
    }

    private static object QueryParameter(string name, string description, string? schemaName = null)
    {
        var schema = schemaName switch
        {
            null => StringSchema(),
            "date" => StringSchema("date"),
            "integer" => IntegerSchema(),
            _ => RefSchema(schemaName)
        };

        return new
        {
            name,
            @in = "query",
            required = false,
            description,
            schema
        };
    }

    private static object PathParameter(string name, string description)
    {
        return new
        {
            name,
            @in = "path",
            required = true,
            description,
            schema = StringSchema("uuid")
        };
    }

    private static object ObjectSchema(Dictionary<string, object> properties)
    {
        return new { type = "object", properties };
    }

    private static object StringSchema(string? format = null)
    {
        return format is null ? new { type = "string" } : new { type = "string", format };
    }

    private static object IntegerSchema()
    {
        return new { type = "integer", format = "int32" };
    }

    private static object NumberSchema()
    {
        return new { type = "number", format = "decimal" };
    }

    private static object BooleanSchema()
    {
        return new { type = "boolean" };
    }

    private static object ArraySchema(object items)
    {
        return new { type = "array", items };
    }

    private static object EnumSchema(string[] values)
    {
        return new { type = "string", @enum = values };
    }

    private static object RefSchema(string schemaName)
    {
        return new Dictionary<string, string>
        {
            ["$ref"] = $"#/components/schemas/{schemaName}"
        };
    }
}
