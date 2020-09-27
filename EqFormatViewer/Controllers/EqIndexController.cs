using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace EqFormatViewer.Controllers {
	public class Index {
		public string Name { get; set; }
		public Dictionary<string, Index> Subdirectories { get; set; }
		public List<string> Files { get; set; }
	}
	
	[ApiController]
	[Route("[controller]")]
	public class EqIndexController {
		public const string EqPath = "/Users/cbrocious/EverQuest/";

		[HttpGet]
		public Index Get() {
			Index Walk(string path, bool first = false) =>
				new Index {
					Name = first ? "/" : Path.GetFileName(path),
					Subdirectories = Directory.GetDirectories(path)
						.Select(x => (Path.GetFileName(x), Walk(Path.Combine(path, x))))
						.ToDictionary(x => x.Item1, x => x.Item2),
					Files = Directory.GetFiles(path).Select(Path.GetFileName).ToList()
				};

			return Walk(EqPath, true);
		}
	}
}