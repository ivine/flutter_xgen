import { FileUtil } from '../util/file.util'

export class PreviewItem {
  path: string

  constructor(path: string) {
    this.path = path
  }

  public toJSON(): any {
    return {
      path: this.path,
      fileExt: FileUtil.getFileExtension(this.path)
    }
  }
}
