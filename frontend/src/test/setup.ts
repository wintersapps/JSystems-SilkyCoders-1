import '@testing-library/jest-dom'

// jsdom does not implement URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = (obj: Blob | MediaSource) => {
  if (obj instanceof File) return `blob:mock/${obj.name}`
  return 'blob:mock/unknown'
}
global.URL.revokeObjectURL = () => {}

// jsdom does not implement HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = () => null

// jsdom does not fire Image onload — mock Image to immediately trigger onload
class MockImage {
  width = 100
  height = 100
  onload: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  private _src = ''
  get src() {
    return this._src
  }
  set src(value: string) {
    this._src = value
    // Fire onload asynchronously to simulate browser behaviour
    if (this.onload) setTimeout(this.onload, 0)
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).Image = MockImage
