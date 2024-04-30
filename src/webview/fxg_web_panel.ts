import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import { getUri, getNonce } from "../util/webview.util"
import { WebViewType, WebViewTypeData, getWebViewTypeData } from "./const"

export class FXGUIWebPanel {
  public static currentPanel: FXGUIWebPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private _arbFiles: string[]

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, arbFiles: string[]) {
    this._arbFiles = arbFiles

    this._panel = panel
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.onDidChangeViewState(this.onDidChangeViewState)
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri)
    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(extensionUri: vscode.Uri, arbFiles: string[]) {
    // 获取配置的类型
    let webViewTypeData: WebViewTypeData = getWebViewTypeData(WebViewType.fxg)
    let viewType: string = webViewTypeData.viewType
    let title: string = webViewTypeData.title
    let viewColumn: vscode.ViewColumn = webViewTypeData.viewColumn

    if (FXGUIWebPanel.currentPanel) {
      FXGUIWebPanel.currentPanel._panel.reveal(viewColumn)
    } else {
      var workspaceFolderUri: vscode.Uri | null = null
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0]
        workspaceFolderUri = vscode.Uri.file(workspaceFolder.uri.fsPath)
      }
      var localResRoots = [vscode.Uri.joinPath(extensionUri, "dist"), vscode.Uri.joinPath(extensionUri, "webview_ui")]
      if (workspaceFolderUri) {
        localResRoots.push(workspaceFolderUri)
      }

      const panel = vscode.window.createWebviewPanel(
        viewType,
        title,
        viewColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: localResRoots,
        }
      )
      FXGUIWebPanel.currentPanel = new FXGUIWebPanel(panel, extensionUri, arbFiles)
    }

    // TODO: 优化一下
    let jsonMap = {}
    for (let tmpPath of arbFiles) {
      const fileContent = fs.readFileSync(tmpPath, 'utf-8')
      const fileName = path.basename(tmpPath)
      jsonMap[fileName] = fileContent
    }
    if (jsonMap) {
      setTimeout(() => {
        FXGUIWebPanel.currentPanel._panel.webview.postMessage({ type: 'fileContent', content: jsonMap })
      }, 500)
    }
  }

  public dispose() {
    this._arbFiles = []

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
    const stylesUri = getUri(webview, extensionUri, ["dist", "webview_ui", "assets", "index.css"])
    const scriptUri = getUri(webview, extensionUri, ["dist", "webview_ui", "assets", "index.js"])

    const nonce = getNonce()

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none' img-src ${webview.cspSource} https: script-src ${webview.cspSource} style-src ${webview.cspSource} 'nonce-${nonce}'">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>FXG UI</title>
        </head>
        <body>
          <div id="root"></div>
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
      (message: any) => {
        const command = message.command
        const text = message.text

        switch (command) {
          case "hello":
            vscode.window.showInformationMessage(text)
            return
        }
      },
      undefined,
      this._disposables
    )
  }
}
