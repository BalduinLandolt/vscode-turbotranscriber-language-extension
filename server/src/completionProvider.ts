import { 
	CompletionItem,
	CompletionItemKind,
	Position,
	TextDocumentIdentifier
} from "vscode-languageserver";

import { Tokenizer } from "./tokenizer";

export class CompletionProvider {
	tokenizer: Tokenizer;
	constructor(tokenizer: Tokenizer) {
		this.tokenizer = tokenizer;
	}

	getCompletions(documentID: TextDocumentIdentifier, position: Position): CompletionItem[] {
		return [
			{
				label: 'blah',
				kind: CompletionItemKind.Text,
				data: 1,
				detail: `ID: ${documentID.uri}\n\nPos: ${position.line},${position.character}`
			}
		]
	}

	resolveCompletion(item: CompletionItem): CompletionItem {
		if (item.data === 1) {
			// item.detail = 'Details information on this super completion';
			item.documentation = {
				kind: 'markdown',
				value: 'Lorem `ipsum`'
			}
		}
		return item;
	}
}