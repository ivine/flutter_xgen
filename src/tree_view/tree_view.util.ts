import * as vscode from 'vscode'
import * as path from 'path';

import { FileUtil } from "../util/file.util";
import { TreeNode, TreeNodeType } from "./tree_node"
import { FXGCommandData, FXGCommandType, getFXGCommandData } from '../manager/command.manager';
import { InteractionEvent, InteractionEventType } from '../manager/interaction.manager';

export default class TreeViewUtil {

  static sortTreeNodeList<T extends TreeNode>(list: T[]): T[] {
    return list.sort((a, b) => {
      let aIsFolder = a.nodeType === TreeNodeType.folder
      let bIsFolder = b.nodeType === TreeNodeType.folder

      let aFileName = FileUtil.getFileName(a.nodeAbsolutePath)
      let bFileName = FileUtil.getFileName(b.nodeAbsolutePath)

      if (aIsFolder && !bIsFolder) {
        return -1; // 文件夹排在前面
      } else if (!aIsFolder && bIsFolder) {
        return 1; // 文件排在后面
      } else {
        return aFileName.localeCompare(bFileName); // 相同类型按名称排序
      }
    });
  }

  static getIconPathForFilePath(filePath: string): string {
    let ext: string = FileUtil.getFileExtension(filePath)
    return "";
  }

  static async getTreeNodeCommand(
    projectDir: string,
    projectName: string,
    filePath: string,
    eventType: InteractionEventType,
  ): Promise<vscode.Command> {
    let resultCommand: vscode.Command | null = null
    let canTextDocPreview = await FileUtil.isFileSuitableForTextDocument(filePath)
    if (canTextDocPreview) {
      let commandData: FXGCommandData = getFXGCommandData(FXGCommandType.openFile)
      resultCommand = {
        title: commandData.title,
        command: commandData.command,
        arguments: [filePath]
      }
    } else {
      const event: InteractionEvent = {
        timestamp: Date.now(),
        eventType: eventType,
        projectInfo: {
          name: projectName,
          dir: projectDir,
        },
        data: filePath
      }
      resultCommand = Object.assign(
        {},
        getFXGCommandData(FXGCommandType.openFXGUIWeb),
        {
          arguments: [
            event,
          ]
        }
      )
    }
    return Promise.resolve(resultCommand)
  }
}