import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class Tokenizer {
	documentManager: TextDocuments<TextDocument>;

	constructor(docs: TextDocuments<TextDocument>) {
		this.documentManager = docs;
	}

	tokenizeDocument(document: TextDocument) {
		// TODO: implement
	}
}