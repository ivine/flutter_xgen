import * as fs from 'fs'

class FileManager {
  private static instance: FileManager | null = null
  private rootPath: string

  private l10nFilePaths: string[] = []
  private assetsDirs: string[] = []

  private constructor(rootPath: string) {
    this.rootPath = rootPath
    this.refreshFilePathsAndDirs()
  }

  static getInstance(rootPath: string): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager(rootPath)
    }
    return FileManager.instance
  }

  // 刷新
  public refreshFilePathsAndDirs() {

  }

  readFile(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

export default FileManager