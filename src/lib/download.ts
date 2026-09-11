/** Saves a URL the page can already read, such as a blob or data URL, as a file. */
export function downloadUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
