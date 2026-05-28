import { Command, Option } from "commander";
import { createConfig } from "../settings/createConfig";
import { version } from "../../package.json";
import { registerDialogueCommands } from "./dialogue";
import { registerMessageCommands } from "./message";
import { registerMemoryCommands } from "./memory";
import { registerSearchCommands } from "./search";

const program = new Command();

program
  .name("dialogue-db")
  .description(
    "CLI for DialogueDB. Auth: prefer DIALOGUEDB_API_KEY env var; --api-key flag also accepted."
  )
  .version(version)
  .addOption(
    new Option(
      "--api-key <key>",
      "API key (overrides DIALOGUEDB_API_KEY). Avoid on shared machines — flag values are visible in `ps` and shell history; prefer the env var."
    )
  )
  .hook("preAction", (cmd) => {
    const apiKey =
      (cmd.opts().apiKey as string | undefined) ??
      process.env.DIALOGUEDB_API_KEY;
    if (!apiKey) {
      process.stderr.write(
        "API key required. Set DIALOGUEDB_API_KEY or pass --api-key <key>.\n"
      );
      process.exit(1);
    }
    createConfig({ apiKey });
  });

registerDialogueCommands(program);
registerMessageCommands(program);
registerMemoryCommands(program);
registerSearchCommands(program);

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
