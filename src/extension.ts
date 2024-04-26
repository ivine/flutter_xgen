// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';
const fs = require('fs');

import * as FXGCommand from './command_names';
import AssetsGenerator from './assets_generator';
import { AssetsSideBar } from './side_bar/assets';
import { L10nSideBar } from './side_bar/l10n';

import { FXGWebPanel } from './webview/panel';
import FileManager from './manager/file.manager';
import WatcherManager from './manager/watcher.manager';

// TODO: auto_detection
let assetsWatcher: vscode.FileSystemWatcher | null = null;
let globalContext: vscode.ExtensionContext;
function initializeExtension(context: vscode.ExtensionContext) {
	globalContext = context;
}
export function getExtensionContext(): vscode.ExtensionContext | null {
	return globalContext;
}

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
	initializeExtension(context)

	// manager 初始化
	FileManager.getInstance().setup(workspaceDir())
	WatcherManager.getInstance().setup(workspaceDir())

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
				FXGWebPanel.render(context.extensionUri, data);
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
		const workspaceFolder = vscode.workspace.workspaceFolders[0]
		return workspaceFolder.uri.fsPath
	} else {
		// 没有打开的工作区
		return null
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	WatcherManager.getInstance().dispose()
}
