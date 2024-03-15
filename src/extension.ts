// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as FAGCommand from './command_names';

import AssetFileItem from './assets_file_item';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let assetsWatcher: vscode.FileSystemWatcher;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	for (let commandName of Object.values(FAGCommand.FAGCommandNames)) {
		let disposable = vscode.commands.registerCommand(commandName, () => {
			if (commandName === FAGCommand.FAGCommandNames.Generate) {
				assetsGenerate();
			} else if (commandName === FAGCommand.FAGCommandNames.StartWatch) {
				assetsWatch(context);
			} else if (commandName === FAGCommand.FAGCommandNames.StopWatch) {
				assetsStopWatch();
			}
		});
	
		context.subscriptions.push(disposable);
	}
}

async function assetsGenerate() {
  try {
    let workspaceDir = getCurrentProjectPath();
    if (!workspaceDir) {
      vscode.window.showErrorMessage('No workspace is open.');
      return;
    }

    // 使用path.join来构建路径，以确保跨平台兼容性
    let pubspecFilePath = path.join(workspaceDir, "pubspec.yaml");
    
    // 读取并解析YAML文件
    let yamlData = await readAndParseYamlFile(pubspecFilePath);
    if (!yamlData) {
      vscode.window.showErrorMessage('Failed to read or parse pubspec.yaml.');
      return;
    }
    
    // 安全地访问嵌套属性
    let fagConfigs = yamlData?.['flutter_assets_generator'];
    let assetsPaths = yamlData?.flutter?.assets;

    // 检查assetsPaths是否存在
    if (!assetsPaths) {
      vscode.window.showErrorMessage('No assets paths found in pubspec.yaml.');
      return;
    }
		
		// 获取当前路径所有文件
		const fileItemList: AssetFileItem[] = [];
		for (let path of assetsPaths) {
			let fullDir = workspaceDir + '/' + path;
			let allFiles = getAllFiles(fullDir);
			let assetDir = path;
			for (let file of allFiles) {
				const item = new AssetFileItem(assetDir, file);
				fileItemList.push(item);
			}
		}

		// 排序
		fileItemList.sort((a: AssetFileItem, b: AssetFileItem) => {
			let pathA = a.getFileVar();
			let pathB = b.getFileVar();
			return pathA > pathB ? 1 : -1;
		});

		// 写文件
		generateAssetsFile(workspaceDir, fileItemList);
    
    vscode.window.showInformationMessage(`Flutter Assets Generator: Assets.dart 生成成功`);
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage('An error occurred during the assets generation process.');
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

	vscode.window.setStatusBarMessage('Flutter Assets Generator: Assets 文件夹监听已开启', 3000);
}

async function assetsStopWatch() {
	if (!assetsWatcher) {
		return;
	}
	assetsWatcher.dispose();
	vscode.window.setStatusBarMessage('Flutter Assets Generator: Assets 文件夹监听已关闭', 3000);
}


/// MARK: - utils

function getCurrentProjectPath() {
  // 检查是否有打开的工作区
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    // 获取第一个工作区的路径
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    return workspaceFolder.uri.fsPath; // fsPath给出了文件系统的路径
  } else {
    // 没有打开的工作区
    vscode.window.showInformationMessage('No workspace is open.');
    return null;
  }
}

function readFileSync(filePath: string): string | void {
  try {
    const absolutePath = path.resolve(filePath);
    const data = fs.readFileSync(absolutePath, 'utf8');
    return data;
  } catch (err) {
    console.error(err);
    vscode.window.showErrorMessage('Failed to read file.');
    // 显式返回undefined以符合string | void的返回类型
    return;
  }
}

async function readAndParseYamlFile(filePath: string) {
  try {
    const fileContents = readFileSync(filePath);
    const data = yaml.load(fileContents);
		return data;
  } catch (err) {
    console.error(err);
    vscode.window.showErrorMessage('Failed to read or parse the YAML file.');
  }
}

// arrayOfFiles [绝对路径]
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file: string) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
			// 子文件夹不添加
      // arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Exclude .DS_Store files
      if (!file.includes('.DS_Store')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function generateAssetsFile(projectPath: string, generatedVarList: AssetFileItem[]): void {
  const generatedAssetsFilePath = path.join(projectPath, 'lib', 'generated', 'assets.dart');

  try {
    // 检查文件是否存在，如果存在，则先清空文件
    if (fs.existsSync(generatedAssetsFilePath)) {
      fs.writeFileSync(generatedAssetsFilePath, '');
    } else {
      // 确保目录存在，如果不存在则递归创建
      fs.mkdirSync(path.dirname(generatedAssetsFilePath), { recursive: true });
    }

    // 生成assets类的内容并写入文件
    const assetsClassContent = createAssetsClass(generatedVarList);
    fs.writeFileSync(generatedAssetsFilePath, assetsClassContent);
  } catch (error) {
    console.error('Failed to generate assets file:', error);
  }
}

function createAssetsClass(assets: AssetFileItem[]): string {
  // 开始构建Assets类的字符串
  let tips = `///This file is automatically generated. DO NOT EDIT, all your changes would be lost.`;
  let classContent = `${tips}\nclass Assets {\n  Assets._();\n\n`;

  for (let asset of assets) {
    // 添加每个asset到类定义中
    classContent += `  ${asset.getLine()}\n`;
  }

  classContent += `}\n`;

  return classContent;
}


// This method is called when your extension is deactivated
export function deactivate() {}
