const p = require('path');
import { FileUtil } from "../util/file.util";
import { FlutterAssetsConfigCr1992Constants, ProjectInfoMsgInterface } from "../webview/const";
import { FXGFile } from "./base"
import { FlutterAssetsGeneratorConfigByCr1992 } from "./project.enum";

class AssetFileByCr1992 extends FXGFile {
  projectInfo: ProjectInfoMsgInterface
  config: FlutterAssetsGeneratorConfigByCr1992

  constructor(
    projectInfo: ProjectInfoMsgInterface,
    config: FlutterAssetsGeneratorConfigByCr1992,
    path: string,
  ) {
    super(path)
    this.projectInfo = projectInfo
    this.config = config
    this.setup()
  }

  // static const String appLogo = 'assets/app/logo.png';
  generatedVarKey: string = '' // appLogo
  generatedVarValue: string = '' // assets/app/logo.png


  // MARK: - getter
  get generatedLineString(): string {
    if (this.generatedVarKey.length === 0 || this.generatedVarValue.length === 0) {
      return ''
    }
    return `static const String ${this.generatedVarKey} = '${this.generatedVarValue}';`
  }


  // MARK: - private methods

  private setup() {
    this.setupDartVarKey()
    this.setupDartVarValue()
  }

  // e.g.: appLogo
  private setupDartVarKey() {
    // 使用文件路径生成变量名，排除文件扩展名
    const projectDir = this.projectInfo.dir
    const projectName = this.projectInfo.name
    const baseName = FileUtil.getFileName(this.path)
    const baseNameWithoutExtension = FileUtil.getFileName(this.path, false)
    const assetsDir = p.join(projectDir, "assets") // project_name/asssets/img/app/logo.png
    const relativePath = this.path.replace(assetsDir, '') // ---> img/app/logo.png

    // config
    const regex = this.config.filename_split_pattern ?? FlutterAssetsConfigCr1992Constants.filename_split_pattern
    const named_with_parent = this.config.named_with_parent ?? true

    // dir
    const allFileNames: string[] = [...relativePath.replaceAll(baseName, '').replaceAll('.', '_').split('/').filter(item => item.length !== 0), baseNameWithoutExtension]
    let upperCaseAllFileNames: string[] = []
    for (let index = 0; index < allFileNames.length; index++) {
      if (named_with_parent && index < allFileNames.length - 2) {
        continue
      }
      const name = this.adjustFirstLetterCase(allFileNames[index], upperCaseAllFileNames.length > 1)
      upperCaseAllFileNames.push(name)
    }

    const separator = regex.length > 1 ? regex.slice(1, 2) : ''
    const resultKey = this.transformString(upperCaseAllFileNames.join(separator), regex)

    this.generatedVarKey = resultKey
  }

  // e.g.: assets/app/logo.png / pakcageName/assets/app/logo.png
  private setupDartVarValue() {
    const projectName = this.projectInfo.name
    const projectDir = this.projectInfo.dir
    let resultValue = `${this.path.replace(p.join(projectDir, "/"), '')}`
    const leading_with_package_name = this.config.leading_with_package_name ?? false
    if (leading_with_package_name && projectName.length > 0) {
      resultValue = `packages/${projectName}/${resultValue}`;
    }
    this.generatedVarValue = resultValue
  }

  // MARK: - utils
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

export default AssetFileByCr1992
