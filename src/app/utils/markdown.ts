const urlRegex = /(?<!`)(?<!\()\b(https?:\/\/[^\s,$'")\]}>]+)(?!`)/g;

export function autoLinkUrls(text: string): string {
  return text.replace(urlRegex, (match) => `[${match}](${match})`);
}
