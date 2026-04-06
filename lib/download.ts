/**
 * Reliable file download utility.
 * Uses the File System Access API (showSaveFilePicker) when available,
 * which provides a native save dialog with proper filename.
 * Falls back to creating an <a> link for older browsers.
 */

export async function downloadFile(
  data: Blob | string,
  filename: string,
  mimeType = 'application/octet-stream',
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })

  // Modern Chrome: native save dialog
  if ('showSaveFilePicker' in window) {
    try {
      const ext = filename.includes('.') ? '.' + filename.split('.').pop() : ''
      const handle = await (window as unknown as { showSaveFilePicker: (opts: Record<string, unknown>) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: filename,
        types: ext ? [{
          description: filename,
          accept: { [mimeType]: [ext] },
        }] : undefined,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e) {
      // User cancelled the dialog
      if ((e as Error).name === 'AbortError') return
      // showSaveFilePicker not supported in this context, fall through
    }
  }

  // Fallback: <a download> trick
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 500)
}

/** Convenience wrapper for markdown files. */
export function downloadMarkdown(content: string, filename: string) {
  return downloadFile(content, filename, 'text/markdown')
}

/** Convenience wrapper for PNG from canvas data URL. */
export async function downloadPNG(dataUrl: string, filename: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return downloadFile(blob, filename, 'image/png')
}
