import { FXGFile } from "./base"

// Generated
export class AssetsGeneratedFile extends FXGFile {
  rowItem: AssetsGeneratedFileRowItem[]

  constructor(
    path: string,
    rowItem: AssetsGeneratedFileRowItem[]
  ) {
    super(path)

    this.rowItem = rowItem
  }
}

export class AssetsGeneratedFileRowItem {
  key: string
  value: string

  constructor(
    key: string,
    value: string,
  ) {
    this.key = key
    this.value = value
  }
}
