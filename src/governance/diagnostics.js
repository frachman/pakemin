export function diagnostic(code, document, field = "") {
  return { code, source: { document, field } };
}

export function sortDiagnostics(errors) {
  return errors.sort((left, right) =>
    compare(left.source.document, right.source.document) ||
    compare(left.source.field, right.source.field) ||
    compare(left.code, right.code)
  );
}

export function compare(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}
