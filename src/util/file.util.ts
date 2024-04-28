import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileUtil {
  /**
   * 获取目录下所有文件（可选地包括子目录中的文件），默认排除.DS_Store文件
   * @param dir 要搜索的目录路径。
   * @param includeSubDirs 是否包括子目录中的文件。
   * @param excludePatterns 附加的要排除的文件模式数组。
   * @returns 匹配的文件路径数组。
   */
  public static getDirAllFiles(
    dir: string,
    includeSubDirs: boolean = false,
    excludePatterns: RegExp[] = []
  ): string[] {
    let arrayOfFiles: string[] = [];

    // 添加默认排除规则：排除 .DS_Store 文件
    const defaultExcludePatterns = [/\.DS_Store$/];
    const allExcludePatterns = defaultExcludePatterns.concat(excludePatterns);

    const readDirRecursively = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && includeSubDirs) {
          readDirRecursively(fullPath);
        } else if (!allExcludePatterns.some(pattern => pattern.test(entry.name))) {
          arrayOfFiles.push(fullPath);
        }
      });
    };

    readDirRecursively(dir);

    return arrayOfFiles;
  }

  // 检查给定路径的文件或目录是否存在。
  public static pathExists(p: string): boolean {
    return fs.existsSync(p);
  }

  public static readFile(filePath: string): Promise<string> {
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
