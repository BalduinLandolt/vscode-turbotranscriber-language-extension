/* --------------------------------------------------------------------------------------------
 * Copyright (c) Balduin Landolt. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { exists, existsSync, mkdirSync, writeFileSync } from "fs";
import { parse, sep, normalize, dirname } from "path";
import { fileURLToPath } from "url";


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;


connection.onInitialize((params: InitializeParams) => {
	console.log('Server initializing...');

	let capabilities = params.capabilities;

	// TODO: look into capabilities and implement that actually correct.

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	console.log('Server initializing finished.');
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
	documents.all().forEach(getDocumentSettings);  // TODO: ?
	console.log('Server initialized.');
});

/**
 * TurboTranscriber Settings
 * 
 * - xmlFilePath: string
 * - xmlFilePathIsAbsolute: boolean
 */
interface ClientSettings {
	xmlFilePath: string;
	xmlFilePathIsAbsolute: boolean;
}

interface ServerSettings {
	xmlFilePath: string;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ClientSettings = {
	xmlFilePath: "ttr-xml.xml",
	xmlFilePathIsAbsolute: false
};
let globalSettings: ClientSettings = defaultSettings;

// Cache the settings of all open documents
let documentClientSettings: Map<string, Thenable<ClientSettings>> = new Map();
let documentServerSettings: Map<string, ServerSettings> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentClientSettings.clear();
	} else {
		globalSettings = <ClientSettings>(
			(change.settings.turboTranscriber || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(getDocumentSettings);
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(textDocument: TextDocument): Thenable<ClientSettings> {
	let resource = textDocument.uri;
	let result = documentClientSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'turboTranscriber'
		});
		documentClientSettings.set(resource, result);
	}
	result.then(() => makePath(resource))
	return result;
}

async function makePath(uri: string) {
	let clSetting = await documentClientSettings.get(uri);
	let res: string;
	if (clSetting?.xmlFilePathIsAbsolute) {
		res = clSetting.xmlFilePath;
	} else {
		let ttrPath = fileURLToPath(uri);
		let parsed = parse(ttrPath);

		let path: string = clSetting!.xmlFilePath.replace('${fileBasenameNoExtension}', parsed.name)
			.replace('${fileDirname}', parsed.dir);
		res = path;
	}
	res = normalize(res);
	documentServerSettings.set(uri, { xmlFilePath: res});
	console.log(`Docpath: ${res}\nURI: ${uri}\n`);
	
}

// function makePath(ttp: Promise<ClientSettings>, uri: string): string {
// 	let tt = await ttp;
// 	if (tt.xmlFilePathIsAbsolute) {
// 		return tt.xmlFilePath;
// 	}
// 	let ttrPath = fileURLToPath(uri);
// 	let parsed = parse(ttrPath);
// 	return "";

// 	}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentClientSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
	transformTextDocument(change.document);
});

async function transformTextDocument(textDocument: TextDocument): Promise<void> {
	let xmlPath = documentServerSettings.get(textDocument.uri)?.xmlFilePath;
	if (!xmlPath){
		//throw new Error("No XML File defined. Cannot transform document.");
		console.warn('No XML File!')
		return;
	}
	let dir = dirname(xmlPath)
	if (!existsSync(dir)){
		mkdirSync(dir, {recursive: true});
	}
	// if (!existsSync(xmlPath)){
	// 	mkdirSync(xmlPath);
	// 	console.log(`Created File: ${xmlPath}`);
	// }
	console.log(`Transformation requested for: ${xmlPath}`);

	writeFileSync(xmlPath, 'Blah', {flag: 'w'});

	// // TODO: implement

	// let settingsPromise = documentSettings.get(textDocument.uri)
	// let settings = settingsPromise?.then((res) => {
	// 	return res;
	// });
	// let unresolvedXmlDocument = (await settings)?.xmlFilePath;
	// let xmlDocument: string = unresolvedXmlDocument!; // TODO: do I need to do something with it?

	// let docURI = textDocument.uri;
	// let path = fileURLToPath(docURI);
	// console.log(`Text Document: ${path}`);
	// exists(path, (exists) => {console.log(`Text Document exists: ${exists}`)})
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while (m = pattern.exec(text)) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
