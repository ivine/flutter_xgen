import * as fs from 'fs'
import * as vscode from 'vscode';

class FileManager {
  private static instance: FileManager | null = null
  private rootPath: string = ""

  private l10nFilePaths: string[] = []
  private assetsDirs: string[] = []

  private constructor() {
    this.refreshFilePathsAndDirs()
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager()
    }
    return FileManager.instance
  }

  public setup(rootPath: string) {
    this.rootPath = rootPath
  }

  public dispose() { }

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