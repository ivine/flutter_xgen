import * as vscode from 'vscode'

import { FlutterIntlConfig } from "../../model/project.enum"
import { checkIfDartPackageInstalled, installDartPubGlobalPackage, runTerminalCommand } from "../../util/process.util"
import { ProjectInfoMsgInterface } from "../../webview/const"

class IntlGenerator {
  private static instance: IntlGenerator | null = null
  private constructor() { }
  static getInstance(): IntlGenerator {
    if (!IntlGenerator.instance) {
      IntlGenerator.instance = new IntlGenerator()
    }
    return IntlGenerator.instance
  }

  public async run(projectInfo: ProjectInfoMsgInterface, config: FlutterIntlConfig) {
    const packageName = "intl_utils"
    const isInstalled_pub_global = await checkIfDartPackageInstalled(packageName)
    if (!isInstalled_pub_global) {
      // 安装
      const suc = await installDartPubGlobalPackage(packageName)
      if (suc) {
        await runTerminalCommand(packageName)
      }
    }

    const commandString = `
      source ~/.zshrc
      cd ${projectInfo.dir}
      dart pub global run intl_utils:generate
      `; // TODO: 优化一下

    const result = await runTerminalCommand(commandString)
    vscode.window.setStatusBarMessage("Flutter XGen: l10n 生成成功", 3000)
    console.log('intl_utils, result: ', result.stdout)
  }
}

export default IntlGenerator