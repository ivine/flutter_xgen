// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import path from 'path';
const fs = require('fs');

import * as FXGCommand from './command_names';
import AssetsGenerator from './assets_generator';
import { AssetsSideBar } from './side_bar/assets';
import { L10nSideBar } from './side_bar/l10n';

import { L10nPanel } from './webview/l10n/panel';

// TODO: auto_detection
let assetsWatcher: vscode.FileSystemWatcher;

const assetsSideBar = new AssetsSideBar('FXG-Assets', workspaceDir() ?? "");
vscode.window.registerTreeDataProvider(
	assetsSideBar.id,
	assetsSideBar
);

const l10nSideBar = new L10nSideBar('FXG-L10n', workspaceDir() ?? "");
vscode.window.registerTreeDataProvider(
	l10nSideBar.id,
	l10nSideBar
);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	for (let commandName of Object.values(FXGCommand.FXGCommandNames)) {
		let disposable = vscode.commands.registerCommand(commandName, (data: any) => {
			if (commandName === FXGCommand.FXGCommandNames.AssetsGenerate) {
				assetsGenerate();
			} else if (commandName === FXGCommand.FXGCommandNames.AssetsStartWatch) {
				assetsWatch(context);
			} else if (commandName === FXGCommand.FXGCommandNames.AssetsStopWatch) {
				assetsStopWatch();
			} else if (commandName === FXGCommand.FXGCommandNames.PreviewFile) {
				vscode.workspace.openTextDocument(data).then((doc) => {
					vscode.window.showTextDocument(doc, { preview: true });
				});
			} else if (commandName === FXGCommand.FXGCommandNames.Previewl10nJson) {
				L10nPanel.render(context.extensionUri);
			}
		});

		context.subscriptions.push(disposable);
	}
}

async function assetsGenerate() {
	try {
		await new AssetsGenerator()?.generate();
		vscode.window.showInformationMessage(`Flutter XGen: Assets.dart 生成成功`);
	} catch (error) {
		console.error(error);
		vscode.window.showErrorMessage(`${error}`);
	}
}

async function assetsWatch(context: vscode.ExtensionContext) {
	assetsStopWatch();
	assetsWatcher = vscode.workspace.createFileSystemWatcher('**/assets/**/*');

	const changeDisposable = assetsWatcher.onDidChange((uri) => {
		assetsGenerate();
	});

	const createDisposable = assetsWatcher.onDidCreate((uri) => {
		assetsGenerate();
	});

	const deleteDisposable = assetsWatcher.onDidDelete((uri) => {
		assetsGenerate();
	});

	context.subscriptions.push(assetsWatcher);

	vscode.window.setStatusBarMessage('Flutter XGen: Assets 文件夹监听已开启', 3000);
}

async function assetsStopWatch() {
	if (!assetsWatcher) {
		return;
	}
	assetsWatcher.dispose();
	vscode.window.setStatusBarMessage('Flutter XGen: Assets 文件夹监听已关闭', 3000);
}

function workspaceDir(): string | null {
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		// 获取第一个工作区的路径
		const workspaceFolder = vscode.workspace.workspaceFolders[0];
		return workspaceFolder.uri.fsPath;
	} else {
		// 没有打开的工作区
		return null;
	}
}


function getWebviewContent(context: vscode.ExtensionContext, webPath: string) {
	const resourcePath = path.join(context.extensionPath, webPath);
	const html = fs.readFileSync(resourcePath, 'utf-8');
	// const dirPath = path.dirname(resourcePath);
	// // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
	// html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
	// 	return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	// });
	return html;
}

// This method is called when your extension is deactivated
export function deactivate() { }
