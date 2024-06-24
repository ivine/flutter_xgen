import * as vscode from 'vscode'

import { getUri, getNonce } from '../util/webview.util'
import {
  AssetsMsgInterface,
  FXGWatcherType,
  InteractionEvent,
  InteractionEventType,
  L10nMsgInterface,
  MsgInterface,
  ProjectInfoMsgInterface,
  WebViewType,
  WebViewTypeData,
  getWebViewTypeData
} from './const'
import WorkspaceManager from '../manager/workspace.manager'
import { FileUtil } from '../util/file.util'
import StoreManager from '../manager/store.manager'
import FXGProject from '../model/project'

export class FXGUIWebPanel {
  public static currentPanel: FXGUIWebPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.onDidChangeViewState(this.onDidChangeViewState)
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri)
    this._setWebviewMessageListener(this._panel.webview)
  }

  public static async render(extensionUri: vscode.Uri, event: InteractionEvent) {
    // 获取配置的类型
    const webViewTypeData: WebViewTypeData = getWebViewTypeData(WebViewType.fxg)
    const viewType: string = webViewTypeData.viewType
    const title: string = webViewTypeData.title
    const viewColumn: vscode.ViewColumn = webViewTypeData.viewColumn

    let isWebNewCreate: boolean = false

    if (FXGUIWebPanel.currentPanel) {
      FXGUIWebPanel.currentPanel._panel.reveal(viewColumn)
    } else {
      let localResRoots = [vscode.Uri.joinPath(extensionUri, 'dist'), vscode.Uri.joinPath(extensionUri, 'webview_ui')]
      var workspaceFolderUri: vscode.Uri | null = null
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0]
        workspaceFolderUri = vscode.Uri.file(workspaceFolder.uri.fsPath)
      }
      if (workspaceFolderUri) {
        localResRoots.push(workspaceFolderUri)
      }
      localResRoots.push(vscode.Uri.file(WorkspaceManager.getInstance().mainProject.dir))

      const panel = vscode.window.createWebviewPanel(viewType, title, viewColumn, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: localResRoots
      })
      FXGUIWebPanel.currentPanel = new FXGUIWebPanel(panel, extensionUri)
      isWebNewCreate = true
    }
    FXGUIWebPanel.currentPanel.postMsg(event, isWebNewCreate)
  }

  async postMsg(event: InteractionEvent, isWebNewCreate: boolean) {
    let project: FXGProject | null = null
    if (WorkspaceManager.getInstance().mainProject.dir === event.projectInfo.dir) {
      project = WorkspaceManager.getInstance().mainProject
    } else {
      const filterList = WorkspaceManager.getInstance().subProjectList.filter((e) => e.dir === event.projectInfo.dir)
      if (filterList.length > 0) {
        project = filterList[0]
      }
    }

    if (project === null) {
      vscode.window.showErrorMessage('Flutter XGen: 打开面板失败')
      return
    }

    const assets: AssetsMsgInterface = {
      flutterGenConfig: null,
      flutterAssetsGeneratorConfigByCr1992: null,
      previewItem: null,
      fileExt: ''
    }
    const l0n: L10nMsgInterface = {
      localizelyFlutterIntlInstalled: false,
      flutterIntlConfig: null,
      arbs: {}
    }

    try {
      if (event.eventType === InteractionEventType.sync_project_info) {
      } else if (event.eventType === InteractionEventType.extToWeb_preview_assets) {
        const item = WorkspaceManager.getInstance().mainProject.getPreviewItem(event.data, false, false)
        assets.previewItem = this._panel.webview.asWebviewUri(vscode.Uri.file(item.path))
        assets.fileExt = FileUtil.getFileExtension(item.path)
      } else if (event.eventType === InteractionEventType.extToWeb_configs_assets) {
        assets.flutterGenConfig = WorkspaceManager.getInstance().mainProject.flutterGenConfig
        assets.flutterAssetsGeneratorConfigByCr1992 = WorkspaceManager.getInstance().mainProject.flutterAssetsGeneratorConfigByCr1992
      } else if (
        event.eventType === InteractionEventType.sync_intl ||
        event.eventType === InteractionEventType.extToWeb_preview_localization ||
        event.eventType === InteractionEventType.extToWeb_configs_localization
      ) {
        l0n.flutterIntlConfig = project.flutterIntlConfig
        const l10nNodes = project.l10nNodes
        for (const node of l10nNodes) {
          const name = FileUtil.getFileName(node.nodeAbsolutePath)
          const path = node.nodeAbsolutePath
          let json = {}
          try {
            const fileData = await FileUtil.readFile(path)
            json = JSON.parse(fileData)
          } catch (error) {
            //
          }
          l0n.arbs[name] = json
        }

        try {
          // 检查 localizely.flutter-intl 是否安装
          const extension = vscode.extensions.getExtension('localizely.flutter-intl')
          if (extension) {
            l0n.localizelyFlutterIntlInstalled = true
          }
        } catch (error) {
          //
        }
      } else {
      }
    } catch (error) {
      console.log('extToWeb_preview_localization, error: ', error)
    }
    const watcherTypes: number[] = StoreManager.getInstance().getProjectWatcherTypes(event.projectInfo.dir) // 拿最新的
    const msg: MsgInterface = {
      type: event.eventType,
      projectInfo: {
        ...event.projectInfo,
        watcherTypes: watcherTypes
      },
      data: {
        assets: assets,
        l10n: l0n
      }
    }
    if (isWebNewCreate) {
      FXGUIWebPanel.currentPanel._panel.webview.postMessage(msg)
    } else {
      setTimeout(() => {
        FXGUIWebPanel.currentPanel._panel.webview.postMessage(msg)
      }, 500)
    }
  }

  public dispose() {
    FXGUIWebPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const stylesUri = getUri(webview, extensionUri, ['dist', 'webview_ui', 'assets', 'index.css'])
    const scriptUri = getUri(webview, extensionUri, ['dist', 'webview_ui', 'assets', 'index.js'])

    const scriptUri_svga = getUri(webview, extensionUri, ['dist', 'webview_ui', 'libs', 'svga.lite.min.js'])
    const scriptUri_wheel_zoom = getUri(webview, extensionUri, ['dist', 'webview_ui', 'libs', 'vanilla-js-wheel-zoom.min.js'])

    const nonce = getNonce()

    // script-src 'self' 'unsafe-eval' 降低页面的安全性, 允许页面执行来自同一来源的脚本，并允许使用 eval 和类似的功能。
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none' img-src ${webview.cspSource} https: script-src 'self' 'unsafe-eval' style-src ${webview.cspSource} 'nonce-${nonce}'">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Flutter XGen</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri_svga}"></script>
          <script type="module" nonce="${nonce}" src="${scriptUri_wheel_zoom}"></script>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `
  }

  // extension 状态监听
  private onDidChangeViewState(e: vscode.WebviewPanelOnDidChangeViewStateEvent) {
    // 同步一下文件状态
    if (e.webviewPanel.visible) {
      // l10n
      // assets
    }
  }

  // web h5 -> vscode extension
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: InteractionEvent) => {
        const data = message.data
        const eventType: InteractionEventType = message.eventType
        const projectInfo: ProjectInfoMsgInterface = message.projectInfo
        const project: FXGProject | null = WorkspaceManager.getInstance().getProjectByDir(projectInfo.dir)

        switch (eventType) {
          case InteractionEventType.sync_intl:
            {
              const event: InteractionEvent = {
                timestamp: Date.now(),
                eventType: InteractionEventType.extToWeb_preview_localization,
                projectInfo: projectInfo,
                data: null
              }
              FXGUIWebPanel.currentPanel.postMsg(event, true)
            }
            break

          case InteractionEventType.sync_project_info:
            {
              const event: InteractionEvent = {
                timestamp: Date.now(),
                eventType: InteractionEventType.sync_project_info,
                projectInfo: projectInfo,
                data: null
              }
              FXGUIWebPanel.currentPanel.postMsg(event, true)
            }
            break

          case InteractionEventType.webToExt_assets_run:
            {
              try {
                const json = JSON.parse(data.data)
                project.runGenerator(data.type, json)
              } catch (error) { }
            }
            break

          case InteractionEventType.webToExt_assets_read_config:
            {
              project.readAssetsGeneratorConfig(data.type)
            }
            break

          case InteractionEventType.webToExt_assets_save_config:
            {
              project.saveFlutterPubspecYamlConfig(data.type, data.config)
            }
            break

          case InteractionEventType.webToExt_intl_watcher_enable:
          case InteractionEventType.webToExt_assets_watcher_cr1992_enable:
          case InteractionEventType.webToExt_assets_watcher_flutter_gen_enable:
            {
              if (typeof data !== 'boolean' || project === null) {
                return
              }
              const enable: boolean = data
              if (eventType === InteractionEventType.webToExt_intl_watcher_enable) {
                project.setWatcherEnable(enable, FXGWatcherType.l10n)
              } else if (eventType === InteractionEventType.webToExt_assets_watcher_cr1992_enable) {
                project.setWatcherEnable(enable, FXGWatcherType.assets_cr1992)
              } else if (eventType === InteractionEventType.webToExt_assets_watcher_flutter_gen_enable) {
                project.setWatcherEnable(enable, FXGWatcherType.assets_flutter_gen)
              }
            }
            break

          case InteractionEventType.webToExt_intl_run:
            {
              project.runGenerator(data.type, data.config, data.data)
            }
            break

          case InteractionEventType.webToExt_intl_read_config:
            {
              project.readAssetsGeneratorConfig(data.type)
            }
            break

          case InteractionEventType.webToExt_intl_save_config:
            {
              project.saveFlutterPubspecYamlConfig(data.type, data.config)
            }
            break

          case InteractionEventType.extToWeb_save_data_to_l10n_arb:
            {
              project.saveData(data.type, data.data)
            }
            break
        }
      },
      undefined,
      this._disposables
    )
  }
}
