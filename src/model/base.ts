import { FileUtil } from "../util/file.util"

export class FXGFile {
  path: string
  isDir: boolean = false

  constructor(path: string) {
    this.path = path
    FileUtil.pathIsDir(path).then(res => {
      this.isDir = res
    })
  }

  get fileName(): string {
    return FileUtil.getFileName(this.path)
  }

  public toJSON(): any {
    return {
      "path": this.path,
      "isDir": this.isDir,
    }
  }
}
