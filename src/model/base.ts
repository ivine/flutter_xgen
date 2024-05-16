import { FileUtil } from "../util/file.util"

export class FXGFile {
  path: string

  constructor(path: string) {
    this.path = path
  }

  get fileName(): string {
    return FileUtil.getFileName(this.path)
  }
}

export class FXGFileTree<T> {
  dir: string // absolutePath
  files: T[]

  constructor(
    dir: string,
    files: T[],
  ) {
    this.dir = dir
    this.files = files
  }

  get dirName(): string {
    return FileUtil.getFileName(this.dir)
  }
}
