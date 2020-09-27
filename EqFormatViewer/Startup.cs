using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EqFormatViewer.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EqFormatViewer {
	public class Startup {
		public Startup(IConfiguration configuration) {
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services) {
			services.AddControllers();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
			//if(env.IsDevelopment()) {
			app.UseDeveloperExceptionPage();
			//}

			app.UseRouting();

			app.UseDefaultFiles();
			app.UseStaticFiles(new StaticFileOptions {
				OnPrepareResponse = context => {
					context.Context.Response.Headers["Cache-Control"] = "no-cache, no-store";
					context.Context.Response.Headers["Expires"] = "-1";
				}
			});
			app.UseStaticFiles(new StaticFileOptions {
				RequestPath = "/eq", 
				ServeUnknownFileTypes = true, 
				FileProvider = new PhysicalFileProvider(EqIndexController.EqPath), 
				OnPrepareResponse = context => context.Context.Response.Headers["Cache-Control"] = "public,max-age=31536000"
			});

			app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
		}
	}
}