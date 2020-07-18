/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

import { existsSync, readdirSync } from "fs";
import { homedir } from "os";

let client: LanguageClient;

// Server Main Class name
const main: string = 'TTRLSPLauncher';

// Server Launcher
// TODO: get this from settings
const serverLauncher: string = 'TurboTranscriber-LSP-Server-0.0.5-jar-with-dependencies.jar'
// const serverLauncher: string = 'TurboTranscriber-LSP-Server-0.0.5-jar-with-dependencies'

export function activate(context: ExtensionContext) {
	console.log('Client activating...');
	

	// Java Runtime
	const { JAVA_HOME } = process.env;
	console.log(`Using java from JAVA_HOME: ${JAVA_HOME}`);

	// If java home is available continue.
	if (JAVA_HOME) {
		// Java execution path.
		let executable: string = path.join(JAVA_HOME, 'bin', 'java');
		console.log(executable);
		

		// Path to launcher
		// TODO: ensure this is dynamic
		let launcherPath: string = path.join(__dirname, '..', '..', 'server', serverLauncher);
		console.log(launcherPath);

		// Use ~/.ttr-lsp/*.jar if any is found
		let serverDirHome: string = path.join(homedir(),'.ttr-lsp');
		let fileList = readdirSync(serverDirHome).filter((f) => path.extname(f)==='.jar')
		if (fileList.length > 0){
			launcherPath = path.join(serverDirHome, fileList[0])
			console.log(`Found Language Server in ~/.ttr-lsp \n-> Using: ${launcherPath}`);
			
		}
		

		// TODO: do I need this?
		const args: string[] = ['-jar', launcherPath];

		// Set the server options 
		// -- java execution path
		// -- argument to be pass when executing the java command
		let serverOptions: ServerOptions = {
			command: executable,
			args: [...args],
			// args: [...args, main],
			// args: [main],
			options: {}
		};

		// Options to control the language client
		let clientOptions: LanguageClientOptions = {
			// Register the server for plain text documents
			documentSelector: [{ scheme: 'file', language: 'ttr' }],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			}
		};

		// Create the language client and start the client.
		client = new LanguageClient(
			'ttr-lsp-server',
			'TurboTranscriber Language Server',
			serverOptions,
			clientOptions
		);

		// Start the client. This will also launch the server
		client.start();
	}

	// ----------------------------------------------------

	// // The server is implemented in node
	// let serverModule = context.asAbsolutePath(
	// 	path.join('server', 'out', 'server.js')
	// );
	// // The debug options for the server
	// // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	// let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// // If the extension is launched in debug mode then the debug server options are used
	// // Otherwise the run options are used
	// let serverOptions: ServerOptions = {
	// 	run: { module: serverModule, transport: TransportKind.ipc },
	// 	debug: {
	// 		module: serverModule,
	// 		transport: TransportKind.ipc,
	// 		options: debugOptions
	// 	}
	// };
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
