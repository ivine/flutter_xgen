import * as vscode from 'vscode'

import { FileUtil } from '../util/file.util'
import { FXGUIWebPanel } from '../webview/fxg_web_panel'

import { getExtensionContext } from '../extension'
import WorkspaceManager from './workspace.manager'
import { FXGWatcherType, FlutterPubspecYamlConfigType } from '../webview/const'

export interface FXGCommandData {
  title: string
  command: string
}

export enum FXGCommandType {
  openFlutterXGenPanel = 'FXG.openFlutterXGenPanel',
  generateAssetsBaseOnCr1992 = 'FXG.generateAssetsBaseOnCr1992',
  startWatchAssetsBaseOnCr1992 = 'FXG.startWatchAssetsBaseOnCr1992',
  stopWatchAssetsBaseOnCr1992 = 'FXG.stopWatchAssetsBaseOnCr1992',
  generateAssetsBaseOnFlutterGen = 'FXG.generateAssetsBaseOnFlutterGen',
  startWatchAssetsBaseOnFlutterGen = 'FXG.startWatchAssetsBaseOnFlutterGen',
  stopWatchAssetsBaseOnFlutterGen = 'FXG.stopWatchAssetsBaseOnFlutterGen',
  generateIntl = 'FXG.generateIntl',
  startWatchIntl = 'FXG.startWatchIntl',
  stopWatchIntl = 'FXG.stopWatchIntl',

  openFile = 'FXG.openFile',
  openFXGUIWeb = 'FXG.openFXGUIWeb'
}

export function getFXGCommandData(type: FXGCommandType): FXGCommandData | null {
  let result: FXGCommandData | null = null
  switch (type) {
    case FXGCommandType.openFile:
      result = { title: 'Flutter XGen: 打开文件', command: FXGCommandType.openFile }
      break

    case FXGCommandType.openFXGUIWeb:
      result = { title: 'Flutter XGen: 打开 FXG UI', command: FXGCommandType.openFXGUIWeb }
      break

    default:
      break
  }
  return result
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
    this.internalCommands.set(FXGCommandType.openFile, getFXGCommandData(FXGCommandType.openFile))
    this.internalCommands.set(FXGCommandType.openFXGUIWeb, getFXGCommandData(FXGCommandType.openFXGUIWeb))

    // 用户可以操作的 commands
    this.pkgCommands = new Map()
    try {
      let tmpCommands: any[] = [
        {
          command: 'FXG.openFlutterXGenPanel',
          title: 'Flutter XGen: 打开 FXG 面板'
        },
        {
          command: 'FXG.generateAssetsBaseOnCr1992',
          title: 'Flutter XGen: Cr1992 生成 Assets.dart'
        },
        {
          command: 'FXG.startWatchAssetsBaseOnCr1992',
          title: 'Flutter XGen: Cr1992 开始监听 Assets 文件夹'
        },
        {
          command: 'FXG.stopWatchAssetsBaseOnCr1992',
          title: 'Flutter XGen: Cr1992 停止监听 Assets 文件夹'
        },
        {
          command: 'FXG.generateAssetsBaseOnFlutterGen',
          title: 'Flutter XGen: FlutterGen 生成 Assets.dart'
        },
        {
          command: 'FXG.startWatchAssetsBaseOnFlutterGen',
          title: 'Flutter XGen: FlutterGen 开始监听 Assets 文件夹'
        },
        {
          command: 'FXG.stopWatchAssetsBaseOnFlutterGen',
          title: 'Flutter XGen: FlutterGen 停止监听 Assets 文件夹'
        },
        {
          command: 'FXG.generateIntl',
          title: 'Flutter XGen: 生成 arb 本地化文件'
        },
        {
          command: 'FXG.startWatchIntl',
          title: 'Flutter XGen: 开始监听 arb 文件夹'
        },
        {
          command: 'FXG.stopWatchIntl',
          title: 'Flutter XGen: 停止监听 arb 文件夹'
        }
      ]
      for (let tc of tmpCommands) {
        this.pkgCommands.set(tc.command, { title: tc.title, command: tc.command })
      }
    } catch (error) {
      console.log('fxg_command.ts, setup - error: ', error)
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
          } else if (value.command === FXGCommandType.openFXGUIWeb) {
            FXGUIWebPanel.render(context.extensionUri, data)
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
          if (value.command === FXGCommandType.openFlutterXGenPanel) {
            vscode.commands.executeCommand("FXG_Assets.focus")
          } else {
            // 暂时只有主项目
            const project = WorkspaceManager.getInstance().mainProject
            if (!project) {
              return
            }
            if (value.command === FXGCommandType.generateAssetsBaseOnCr1992) {
              project.runGenerator(
                FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992,
                project.flutterAssetsGeneratorConfigByCr1992
              )
            } else if (value.command === FXGCommandType.startWatchAssetsBaseOnCr1992) {
              project.setWatcherEnable(true, FXGWatcherType.assets_cr1992)
            } else if (value.command === FXGCommandType.stopWatchAssetsBaseOnCr1992) {
              project.setWatcherEnable(false, FXGWatcherType.assets_cr1992)
            } else if (value.command === FXGCommandType.generateAssetsBaseOnFlutterGen) {
              project.runGenerator(FlutterPubspecYamlConfigType.flutter_gen, project.flutterGenConfig)
            } else if (value.command === FXGCommandType.startWatchAssetsBaseOnFlutterGen) {
              project.setWatcherEnable(true, FXGWatcherType.assets_flutter_gen)
            } else if (value.command === FXGCommandType.stopWatchAssetsBaseOnFlutterGen) {
              project.setWatcherEnable(false, FXGWatcherType.assets_flutter_gen)
            } else if (value.command === FXGCommandType.generateIntl) {
              project.runGenerator(FlutterPubspecYamlConfigType.flutter_intl, project.flutterIntlConfig)
            } else if (value.command === FXGCommandType.startWatchIntl) {
              project.setWatcherEnable(true, FXGWatcherType.l10n)
            } else if (value.command === FXGCommandType.stopWatchIntl) {
              project.setWatcherEnable(false, FXGWatcherType.l10n)
            }
          }
        })
        context.subscriptions.push(disposable)
      } catch (error) {
        console.log('command.manager.ts, registerCommand - this.pkgCommands, error: ', error)
      }
    }
  }

  private async previewFile(filePath: string) {
    let canTextDocPreview = await FileUtil.isFileSuitableForTextDocument(filePath)
    if (canTextDocPreview) {
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc, { preview: true })
      })
    } else {
      let ext = FileUtil.getFileExtension(filePath)
      console.log('can not preview, ext: ', ext)
    }
  }
}
