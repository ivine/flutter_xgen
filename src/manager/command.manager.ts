import * as vscode from 'vscode'
import { FileUtil } from '../util/file.util'
import { getExtensionContext } from '../extension'

export interface FXGCommandData {
  title: string
  command: string
}

export enum FXGCommandType {
  generateAssets = "FXG.generateAssets",
  startWatchAssets = "FXG.startWatchAssets",
  stopWatchAssets = "FXG.stopWatchAssets",
  generateIntl = "FXG.generateIntl",
  startWatchIntl = "FXG.startWatchIntl",
  stopWatchIntl = "FXG.stopWatchIntl",

  openFile = "FXG.openFile",
  openWebView = "FXG.openWebView",
}

export default class CommandManager {
  private static instance: CommandManager | null = null
  private constructor() { }
  static getInstance(): CommandManager {
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager()
    }
    return CommandManager.instance
  }

  public internalCommands: Map<FXGCommandType, FXGCommandData> = new Map()
  public pkgCommands: Map<FXGCommandType, FXGCommandData> = new Map()

  public async setup() {
    // 插件自身需要的 commands
    this.internalCommands = new Map()
    this.internalCommands.set(FXGCommandType.openWebView, { title: "Flutter XGen: 打开 XGen", command: FXGCommandType.openWebView })
    this.internalCommands.set(FXGCommandType.openFile, { title: "Flutter XGen: 预览文件", command: FXGCommandType.openFile })

    // 用户可以操作的 commands
    this.pkgCommands = new Map()
    try {
      let tmpCommands: any[] = [
        {
          "command": "FXG.generateAssets",
          "title": "Flutter XGen: 生成 Assets.dart"
        },
        {
          "command": "FXG.startWatchAssets",
          "title": "Flutter XGen: 开始监听 Assets 文件夹"
        },
        {
          "command": "FXG.stopWatchAssets",
          "title": "Flutter XGen: 停止监听 Assets 文件夹"
        },
        {
          "command": "FXG.generateIntl",
          "title": "Flutter XGen: 生成 arb 本地化文件"
        },
        {
          "command": "FXG.startWatchIntl",
          "title": "Flutter XGen: 开始监听 arb 文件夹"
        },
        {
          "command": "FXG.stopWatchIntl",
          "title": "Flutter XGen: 停止监听 arb 文件夹"
        }
      ]
      for (let tc of tmpCommands) {
        this.pkgCommands.set(tc.command, { title: tc.title, command: tc.command })
      }
    } catch (error) {
      console.log("fxg_command.ts, setup - error: ", error)
    }

    this.registerCommand()
  }


  private registerCommand() {
    let context: vscode.ExtensionContext | null = getExtensionContext()
    if (!context) {
      console.log('command.manager.ts, registerCommand - context no exist')
      return
    }

    for (let key of Array.from(this.internalCommands.keys())) {
      try {
        let value: FXGCommandData = this.internalCommands.get(key)
        let disposable = vscode.commands.registerCommand(value.command, (data: any) => {
          if (value.command == FXGCommandType.openFile) {
            this.previewFile(data)
          } else if (value.command === FXGCommandType.openWebView) {
            console.log("dw test, internalCommands data: ", value)
            console.log("dw test, internalCommands data: ", data)
          }
        })
        context.subscriptions.push(disposable)
      } catch (error) {
        console.log('command.manager.ts, registerCommand - this.internalCommands, error: ', error)
      }
    }

    for (let key of Array.from(this.pkgCommands.keys())) {
      try {
        let value = this.pkgCommands.get(key)
        let disposable = vscode.commands.registerCommand(value.command, (data: any) => {
          console.log("dw test, pkgCommands data: ", value)
          console.log("dw test, pkgCommands data: ", data)
        })
        context.subscriptions.push(disposable)
      } catch (error) {
        console.log('command.manager.ts, registerCommand - this.pkgCommands, error: ', error)
      }
    }

    // for (let commandName of Object.values(FXGCommand.FXGCommandNames)) {
    // 	let disposable = vscode.commands.registerCommand(commandName, (data: any) => {
    // 		if (commandName === FXGCommand.FXGCommandNames.AssetsGenerate) {
    // 			assetsGenerate()
    // 		} else if (commandName === FXGCommand.FXGCommandNames.AssetsStartWatch) {
    // 			assetsWatch(context)
    // 		} else if (commandName === FXGCommand.FXGCommandNames.AssetsStopWatch) {
    // 			assetsStopWatch()
    // 		} else if (commandName === FXGCommand.FXGCommandNames.PreviewFile) {
    // 			vscode.workspace.openTextDocument(data).then((doc) => {
    // 				vscode.window.showTextDocument(doc, { preview: true })
    // 			})
    // 		} else if (commandName === FXGCommand.FXGCommandNames.Previewl10nJson) {
    // 			FXGWebPanel.render(context.extensionUri, data)
    // 		}
    // 	})
    // 	context.subscriptions.push(disposable)
    // }
  }

  private async previewFile(filePath: string) {
    let canTextDocPreview = await FileUtil.isFileSuitableForTextDocument(filePath)
    if (canTextDocPreview) {
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc, { preview: true })
      })
    } else {
      let ext = FileUtil.getFileExtension(filePath)
      console.log("dw test, ext: ", ext)
    }
  }
}