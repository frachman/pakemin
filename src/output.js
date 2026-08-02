export function reportWriteResult(stream, title, result) {
  write(stream, `${title}\n`);

  for (const file of result.written) {
    write(stream, `created: ${file}\n`);
  }

  for (const file of result.skipped) {
    write(stream, `dry-run: ${file}\n`);
  }

  for (const file of result.blocked) {
    write(stream, `exists: ${file} (use --force to overwrite)\n`);
  }
}

export function write(stream, text) {
  stream.write(text);
}
