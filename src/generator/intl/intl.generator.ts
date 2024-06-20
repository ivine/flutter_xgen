import * as vscode from 'vscode'

import { FlutterIntlConfig } from '../../model/project.enum'
import { checkIfDartPackageInstalled, installDartPubGlobalPackage, runTerminalCommand } from '../../util/process.util'
import { ProjectInfoMsgInterface } from '../../webview/const'
import WorkspaceManager from '../../manager/workspace.manager'

class IntlGenerator {
  private static instance: IntlGenerator | null = null
  private constructor() {}
  static getInstance(): IntlGenerator {
    if (!IntlGenerator.instance) {
      IntlGenerator.instance = new IntlGenerator()
    }
    return IntlGenerator.instance
  }

  public async run(projectInfo: ProjectInfoMsgInterface, config: FlutterIntlConfig) {
    // TODO: 如果开启了自动监听，这里会执行两次
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Flutter XGen: FlutterIntl 运行中...',
        cancellable: true
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          console.log('User canceled the long running operation')
        })

        progress.report({ increment: 0 })

        try {
          await this._runFlutterIntl(projectInfo, config)
          progress.report({ increment: 100 })
          await new Promise((resolve) => setTimeout(resolve, 500))
          vscode.window.showInformationMessage(`Flutter XGen: FlutterIntl l10n 生成成功`)
        } catch (error) {
          vscode.window.showErrorMessage(`Flutter XGen: FlutterIntl l10n 生成失败`)
        }
      }
    )
  }

  private async _runFlutterIntl(projectInfo: ProjectInfoMsgInterface, config: FlutterIntlConfig) {
    const packageName = 'intl_utils'
    const isInstalled_pub_global = await checkIfDartPackageInstalled(packageName)
    if (!isInstalled_pub_global) {
      // 安装
      const suc = await installDartPubGlobalPackage(packageName)
      if (suc) {
        await runTerminalCommand(packageName)
      }
    }

    const commandString = `
      export PATH="$PATH:$HOME/.pub-cache/bin"
      export PATH="$PATH:/usr/local/opt/dart/libexec/bin"
      export PATH="$PATH:$HOME/fvm/default/bin"
      export PATH="$PATH:${WorkspaceManager.getInstance().dartPath}"
      cd ${projectInfo.dir}
      dart pub global run intl_utils:generate
      ` // TODO: 优化一下

    const result = await runTerminalCommand(commandString)
    vscode.window.setStatusBarMessage('Flutter XGen: l10n 生成成功', 3000)
    console.log('intl_utils, result: ', result.stdout)
  }
}

export default IntlGenerator
