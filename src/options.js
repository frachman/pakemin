export function parseOptions(args) {
  const flags = new Set();
  const values = {};
  const positionals = [];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const option = arg.slice(2);
      const [key, value] = option.split("=", 2);
      if (value !== undefined) {
        values[key] = value;
      } else {
        flags.add(key);
      }
    } else {
      positionals.push(arg);
    }
  }

  return { flags, values, positionals };
}
