import { FXGFile } from "./base"

export class PreviewItem extends FXGFile {
  previousItem?: PreviewItem | null
  nextItem?: PreviewItem | null

  constructor(
    path: string,
    previousItem: PreviewItem | null,
    nextItem?: PreviewItem | null,
  ) {
    super(path)

    this.previousItem = previousItem
    this.nextItem = nextItem
  }
}