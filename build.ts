import { walk } from "@std/fs/walk";

const commands = await Array.fromAsync(
	walk("./commands", { includeDirs: false }),
);

const manifest = `
import { type Manifest } from "./types.d.ts";

${
	commands.map((ctx, index) => `import $${index} from "./${ctx.path}";`)
		.join("\n")
}

export default {
	commands: [
		${commands.map((_ctx, index) => `$${index}`).join(",\n")}
	]
} satisfies Manifest`;

await Deno.writeTextFile("manifest.gen.ts", manifest);
await new Deno.Command(Deno.execPath(), { args: ["fmt", "manifest.gen.ts"] })
	.output();
