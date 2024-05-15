import { FileUtil } from "../util/file.util"
import { FXGFile } from "./base"

export class AssetsFile extends FXGFile {
  isValid: boolean // 在 pubspec.yaml 的 flutter - assets 中有配置
  children: AssetsFile[]

  constructor(
    path: string,
    isValid: boolean,
    children: AssetsFile[],
  ) {
    super(path)

    this.isValid = isValid
    this.children = children

    FileUtil.pathIsDir(this.path).then((isDir: boolean) => {
      this.isDir = isDir
    })
  }

  isDir: boolean = false

}

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
