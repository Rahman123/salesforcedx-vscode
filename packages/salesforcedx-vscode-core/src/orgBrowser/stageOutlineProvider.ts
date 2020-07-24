import {
  ManifestGenerator,
  RegistryAccess
} from '@salesforce/source-deploy-retrieve';
import { MetadataComponent } from '@salesforce/source-deploy-retrieve/lib/types';
import { existsSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { nls } from '../messages';

const RESOURCES_PATH = join(__filename, '..', '..', '..', '..', 'resources');
const LOCAL_ICON = join(RESOURCES_PATH, 'dark', 'circle-filled.svg');
const REMOTE_ICON = join(RESOURCES_PATH, 'dark', 'circle-outline.svg');

export class StageNode extends vscode.TreeItem {
  public parent?: StageNode;
  public readonly children: StageNode[] = [];
  public readonly typeName?: string;
  private _fileUri?: vscode.Uri;

  constructor(
    label: string,
    collapsableState?: vscode.TreeItemCollapsibleState,
    typeName?: string,
    fileUri?: vscode.Uri
  ) {
    super(label, collapsableState);
    this.typeName = typeName;
    this.fileUri = fileUri;
    this.command = !typeName
      ? {
          command: 'sfdx.force.metadata.stage.view.open',
          title: 'Open metadata',
          arguments: [this]
        }
      : undefined;
  }

  public addChild(node: StageNode): void {
    node.parent = this;
    this.children.push(node);
  }

  set fileUri(uri: vscode.Uri | undefined) {
    this._fileUri = uri;
    this.updateStatus();
  }

  get fileUri() {
    if (this._fileUri && !existsSync(this._fileUri.fsPath)) {
      this._fileUri = undefined;
      this.updateStatus();
    }
    return this._fileUri;
  }

  private updateStatus() {
    if (!this.typeName) {
      this.iconPath = this._fileUri ? LOCAL_ICON : REMOTE_ICON;
    }
  }
}

export class ComponentStageOutlineProvider
  implements vscode.TreeDataProvider<StageNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    StageNode | undefined
  > = new vscode.EventEmitter<StageNode | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<
    StageNode | undefined
  > = this._onDidChangeTreeData.event;

  private typeNameToNode = new Map<string, StageNode>();

  public getTreeItem(element: StageNode): StageNode {
    return element;
  }

  public getParent(element: StageNode): StageNode | undefined {
    return element.parent;
  }

  public getChildren(element?: StageNode | undefined): Promise<StageNode[]> {
    let nodes: StageNode[];
    if (element) {
      nodes = element.children;
    } else {
      nodes = Array.from(this.typeNameToNode.values());
    }
    nodes.sort((a: StageNode, b: StageNode) =>
      a.label!.localeCompare(b.label!)
    );
    return Promise.resolve(nodes);
  }

  public addComponent(
    component: {
      fullName: string;
      type: string;
    },
    fileUri?: vscode.Uri
  ): StageNode {
    const { fullName, type: mdType } = component;

    if (!this.typeNameToNode.has(mdType)) {
      const typeLabel = nls.localize(mdType);
      this.typeNameToNode.set(
        mdType,
        new StageNode(
          typeLabel,
          vscode.TreeItemCollapsibleState.Expanded,
          mdType
        )
      );
    }
    const typeNode = this.typeNameToNode.get(mdType)!;

    let componentNode = typeNode.children.find(
      child => child.label === fullName
    );
    if (!componentNode) {
      componentNode = new StageNode(fullName, undefined, undefined, fileUri);
      typeNode.addChild(componentNode);
    }

    this._onDidChangeTreeData.fire();

    return componentNode;
  }

  public removeComponent(node: StageNode): void {
    if (node.parent) {
      const index = node.parent.children.findIndex(
        child => child.label === node.label
      );
      node.parent.children.splice(index, 1);
      if (node.parent.children.length === 0) {
        this.typeNameToNode.delete(node.parent.typeName!);
      }
      node.parent = undefined;
      this._onDidChangeTreeData.fire();
    }
    if (node.children.length > 0) {
      node.parent = undefined;
      this.typeNameToNode.delete(node.typeName!);
      this._onDidChangeTreeData.fire();
    }
  }

  public async createManifest(output: vscode.Uri): Promise<void> {
    if (this.typeNameToNode.size > 0) {
      const registryAccess = new RegistryAccess();
      const manifestGenerator = new ManifestGenerator();
      const components: MetadataComponent[] = [];
      for (const typeNode of this.typeNameToNode.values()) {
        const type = registryAccess.getTypeFromName(typeNode.typeName!);
        for (const componentNode of typeNode.children) {
          components.push({
            fullName: componentNode.label!,
            type,
            xml: ''
          });
        }
      }
      const encoder = new TextEncoder();
      const contents = encoder.encode(
        manifestGenerator.createManifest(components)
      );
      await vscode.workspace.fs.writeFile(output, contents);
    }
  }

  public clearAll(): void {
    this.typeNameToNode.clear();
    this._onDidChangeTreeData.fire();
  }

  public refresh(node?: StageNode) {
    this._onDidChangeTreeData.fire(node);
  }
}
