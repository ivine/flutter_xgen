class AssetFileItem {
  assetDir: string; // e.g.: ${ProjectDir}/assets/img/
  assetFullPath: string;

  constructor(assetDir: string, assetFullPath: string) {
    this.assetDir = assetDir;
    this.assetFullPath = assetFullPath;
  }

  // Mimic path.basenameWithoutExtension from Dart
  private basenameWithoutExtension(path: string): string {
    const baseName = this.basename(path);
    return baseName.includes('.') ? baseName.substring(0, baseName.lastIndexOf('.')) : baseName;
  }

  // Mimic path.dirname from Dart
  private dirname(path: string): string {
    return path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
  }

  // Mimic path.basename from Dart
  private basename(path: string): string {
    return path.substring(path.lastIndexOf('/') + 1);
  }

  // Convert string to CamelCase
  private toCamelCase(str: string, lowerLeadingFirst: boolean = false): string {
    let result = '';
    const strs = str.split('_');
    strs.forEach((element, index) => {
      if (element === '') {
        return;
      }
      let firstS = element.substring(0, 1).toUpperCase();
      if (lowerLeadingFirst && index === 0) {
        firstS = firstS.toLowerCase();
      }
      const remainS = element.substring(1);
      result += `${firstS}${remainS}`;
    });
    return result;
  }

  getFileVar(): string {
    const fileName = this.basenameWithoutExtension(this.assetFullPath);
    const directoryPath = this.dirname(this.assetFullPath);
    const lastDirectoryName = this.basename(directoryPath);
    return `${this.toCamelCase(lastDirectoryName, true)}${this.toCamelCase(fileName)}`;
  }

  getFileRelativePath(): string {
    const fileNameAndExtension = this.basename(this.assetFullPath);
    return `${this.assetDir}${fileNameAndExtension}`;
  }

  getLine(): string {
    return `static const String ${this.getFileVar()} = '${this.getFileRelativePath()}';`;
  }

  extractInitialsAndUppercaseFileVar(): string {
    let input = this.getFileVar();
    // 确保输入非空，否则直接返回空字符串
    if (!input) {
      return '';
    }
  
    // 提取首字母
    let result = input[0];
  
    // 从第二个字符开始遍历字符串
    for (let i = 1; i < input.length; i++) {
      const char = input[i];
      // 如果字符是大写，则加入到结果字符串中
      if (char === char.toUpperCase() && char !== char.toLowerCase()) {
        result += char;
      }
    }
  
    return result;
  }
}

export default AssetFileItem;