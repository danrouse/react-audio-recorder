// trigger a browser file download of binary data
export default function downloadBlob(blob: Blob, filename: string): HTMLAnchorElement {
  const url = window.URL.createObjectURL(blob);
  const click = document.createEvent('Event');
  click.initEvent('click', true, true);

  const link = document.createElement('A') as HTMLAnchorElement;
  link.href = url;
  link.download = filename;
  link.dispatchEvent(click);
  link.click();
  return link;
}
