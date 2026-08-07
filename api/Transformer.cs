using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

public class BearerSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var schemes = await authenticationSchemeProvider.GetAllSchemesAsync();

        // your scheme is registered as "JwtBearer"
        if (schemes.Any(s => s.Name == "JwtBearer"))
        {
            var bearerScheme = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token below."
            };

            document.Components ??= new OpenApiComponents();
            document.AddComponent("Bearer", bearerScheme);

            var securityRequirement = new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] = []
            };

            foreach (var operation in document.Paths.Values.SelectMany(path => path.Operations))
            {
                operation.Value.Security ??= new List<OpenApiSecurityRequirement>();
                operation.Value.Security.Add(securityRequirement);
            }
        }

        //for swaggwer use this code to add the security requirement to all operations
        //         builder.Services.AddSwaggerGen(option =>
        // {
        //     option.SwaggerDoc("v1", new OpenApiInfo { Title = "Demo API", Version = "v1" });
        //     option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        //     {
        //         In = ParameterLocation.Header,
        //         Description = "Please enter a valid token",
        //         Name = "Authorization",
        //         Type = SecuritySchemeType.Http,
        //         BearerFormat = "JWT",
        //         Scheme = "Bearer"
        //     });
        //     option.AddSecurityRequirement(new OpenApiSecurityRequirement
        //     {
        //         {
        //             new OpenApiSecurityScheme
        //             {
        //                 Reference = new OpenApiReference
        //                 {
        //                     Type=ReferenceType.SecurityScheme,
        //                     Id="Bearer"
        //                 }
        //             },
        //             new string[]{}
        //         }
        //     });
        // });
    }
}