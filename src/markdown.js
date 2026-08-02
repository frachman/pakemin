export function markdownLinks(text) {
  const links = [];
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    links.push(match[1]);
  }

  return links;
}

export function isExternalLink(href) {
  return /^(https?:|mailto:|#)/.test(href);
}
