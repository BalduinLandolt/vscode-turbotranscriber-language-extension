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
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { exists } from "fs";
import { fileURLToPath } from "url";

import { CompletionProvider } from "./completionProvider";
import { Tokenizer } from './tokenizer';


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

// Create a simple text document manager. 
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let tokenizer = new Tokenizer(documents);
let completionProvider = new CompletionProvider(tokenizer);


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
});

/**
 * TurboTranscriber Settings
 * 
 * - xmlFilePath: String
 */
interface TurboTranscriber {
	xmlFilePath: string;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: TurboTranscriber = { xmlFilePath: "ttr-xml.xml" };
let globalSettings: TurboTranscriber = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<TurboTranscriber>> = new Map();

connection.onDidChangeConfiguration(change => {
	console.log("Something changed in settings!");
	console.log(`Configuration Capabilities: ${hasConfigurationCapability}`)
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <TurboTranscriber>(
			(change.settings.turboTranscriber || defaultSettings)  // TODO: should not be example anymore
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<TurboTranscriber> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'turboTranscriber'  // TODO: should not be example anymore
		});
		documentSettings.set(resource, result);
		console.log(documentSettings.get(resource));
		
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	tokenizer.tokenizeDocument(change.document)
	//validateTextDocument(change.document);
	// transformTextDocument(change.document);
});

async function transformTextDocument(textDocument: TextDocument): Promise<void> {
	// TODO: implement

	let settingsPromise = documentSettings.get(textDocument.uri)
	let settings = settingsPromise?.then((res) => {
		return res;
	});
	let unresolvedXmlDocument = (await settings)?.xmlFilePath;
	let xmlDocument: string = unresolvedXmlDocument!; // TODO: do I need to do something with it?

	let docURI = textDocument.uri;
	let path = fileURLToPath(docURI);
	console.log(`Text Document: ${path}`);
	exists(path, (exists) => {console.log(`Text Document exists: ${exists}`)})
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(textDocument.uri);

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

connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		return completionProvider.getCompletions(_textDocumentPosition.textDocument, _textDocumentPosition.position);
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return completionProvider.resolveCompletion(item);
	}
);

documents.listen(connection);
connection.listen();
