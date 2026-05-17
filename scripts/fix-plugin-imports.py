from pathlib import Path

root = Path(__file__).resolve().parents[1]
for p in root.rglob("*.ts"):
    if "node_modules" in p.parts:
        continue
    t = p.read_text(encoding="utf-8")
    if "logPluginApiFailure" not in t:
        continue
    if p.name == "pluginLogServer.ts":
        continue
    new_t = t.replace(
        "import { logPluginApiFailure } from '@/lib/pluginLog'",
        "import { logPluginApiFailure } from '@/lib/pluginLogServer'",
    )
    new_t = new_t.replace(
        "import { logPluginApiFailure } from \"@/lib/pluginLog\"",
        "import { logPluginApiFailure } from \"@/lib/pluginLogServer\"",
    )
    if new_t != t:
        p.write_text(new_t, encoding="utf-8", newline="\n")
        print("fixed", p.relative_to(root))
