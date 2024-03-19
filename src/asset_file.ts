const p = require('path');

import { FAGConstants, GeneratorConfig } from './config';

class AssetFile {
  projectDir: string; // 项目路径，例如: "/Users/xxx/Desktop/ProjectA/"
  assetsDir: string; // 资源文件夹的相对路径，例如: "assets/img/camera"
  filePath: string; // 完整文件路径，例如: "/Users/xxx/Desktop/ProjectA/assets/img/camera/abc.png"

  constructor(projectDir: string, assetsDir: string, filePath: string, config: GeneratorConfig | null) {
    this.projectDir = projectDir;
    this.assetsDir = assetsDir;
    this.filePath = filePath;

    this.dartVarName = this.getDartVarName(config);
    this.dartVarValue = this.getDartVarValue(config);
  }

  dartVarName: string = '';
  dartVarValue: string = '';

  /**
   * 获取文件的基本名称（basename）。
   * 
   * @param path 文件路径，例如 "assets/img/camera/abc.png"
   * @param withExtension 指定是否包含文件扩展名，默认为 true
   * @returns 文件的基本名称，根据 withExtension 参数决定是否包含扩展名
   */
  private basename(path: string, withExtension: boolean = true): string {
    const baseName = path.split('/').pop() ?? "";
    return withExtension ? baseName : baseName.split('.')[0];
  }

  /**
   * 生成 Dart 类变量名称。
   * 
   * @returns Dart 类变量名称，遵循驼峰命名法，并考虑文件路径。
   */
  private getDartVarName(config: GeneratorConfig | null): string {
    // 使用文件路径生成变量名，排除文件扩展名
    const baseName = this.basename(this.filePath);
    const baseNameWithoutExtension = this.basename(this.filePath, false);
    const assetsDir = p.join(this.projectDir, "assets");
    const relativePath = this.filePath.replace(assetsDir, '');
    const allDirs = relativePath.replaceAll(baseName, '').replaceAll('.', '_').split('/').filter(item => item.length !== 0);
    const regex = config?.filenameSplitPattern ?? FAGConstants.VALUE_FILENAME_SPLIT_PATTERN;

    // 那个插件v2.4.2路径和文件名分别匹配生成...~_~
    let dirPath = allDirs.join("_");
    if (config && config.namedWithParent) {
      if (allDirs.length > 0) {
        dirPath = `${allDirs[allDirs.length - 1]}`;
      }
    } else {
      // T_T, 那个插件v2.4.2的规则只有文件名，且不用大写首字母...
      dirPath = '';
    }
    let varNameStr = this.adjustFirstLetterCase(baseNameWithoutExtension, false);
    if (dirPath.length > 0) {
      dirPath = this.transformString(dirPath, regex);
      varNameStr = `${dirPath}${this.adjustFirstLetterCase(baseNameWithoutExtension, true)}`;
    }
    let result = `${this.transformString(varNameStr, regex)}`;

    /**
    let varNameStr = `${allDirs.join("_")}_${baseNameWithoutExtension}`;
    if (config && config.namedWithParent) {
      if (allDirs.length > 0) {
        varNameStr = `${allDirs[allDirs.length - 1]}_${baseNameWithoutExtension}`;
      } else {
        varNameStr = baseNameWithoutExtension;
      }
    }
    let result = `${this.transformString(varNameStr, regex)}`;
    */
    return result;
  }

  /**
   * 生成 Dart 类变量的值。
   * 
   * @returns 文件的相对路径，作为 Dart 类变量的值。
   */
  private getDartVarValue(config: GeneratorConfig | null): string {
    let result = `${this.filePath.replace(p.join(this.projectDir, "/"), '')}`;
    if (config && config.leadingWithPackageName && config.packageName.length > 0) {
      result = `packages/${config.packageName}/${result}`;
    }
    return result;
  }

  /**
   * 生成 Dart 代码的一行声明，包含变量名和变量值。
   * 
   * @returns Dart 类的静态常量字符串声明。
   */
  public getDartAssetLine(): string {
    let result = `static const String ${this.dartVarName} = '${this.dartVarValue}';`;
    return result;
  }

  private transformString(inputString: string, regexPattern: string): string {
    const regex = new RegExp(`${regexPattern}+(.)`, 'g');
    const outputString = inputString.replace(regex, (match, p1) => p1.toUpperCase());
    return outputString;
  }
  
  private adjustFirstLetterCase(str: string, capitalize: boolean): string {
    if (!str) {
      return str;
    }
    const firstCharTransformed = capitalize ? str.charAt(0).toUpperCase() : str.charAt(0).toLowerCase();
    return firstCharTransformed + str.slice(1);
  }
}

export default AssetFile;
