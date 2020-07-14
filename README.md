# TurboTranscriber - VS Code Language Package

Transcribe medieval manuscripts in __no time__ with the help of TurboTranscriber. But with this extension, you can have all the TurboTranscriber features in VS Code.

> Note: This package is still very much under development.
>
> At the moment it does not do much for you, except syntax highlighting.


## Idea behind TurboTranscriber

The initial 'TurboTranscriber' was an open source standalone Java application developed by Balduin Landolt. All the releases and code can be found on [Github](https://github.com/BalduinLandolt/turboTranscriber). Development is somewhat on ice for the moment, but it might get continued in the future.  
The aim behind this extension is to provide as many of the features of TurboTranscriber as possible within the framework of Visual Studio Code.

TurboTranscriber aims to provide a hand full of features, all of which are designed to speed up the process of transcribing medieval manuscripts into TEI XML. These include:

- Out of the box document structure
    - TEI XML right away
    - Schema declaration, stylesheets, ... all done for you
    - No more looking up the TEI Header
- Quick and easy transcription
    - Many XML tags can be implied
    - Super simple markup-language ("TurboTranscriberRaw" aka ".ttr")
- "What you see is what you get" aspects
    - See what you have been transcribing while you are transcribing it
    - Real-time conversion of .ttr to XML
    - Real-time rendering of XML with stylesheet
- Handy working environment
    - Have exemplar, editor and output next to each other
    - No more overlapping windows
- IDE-style help
    - Syntax highlighting
    - Code completion
    - Error-detection



------

TODO: continue

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something




-----

## Road Map

The following features are planned to be implemented.

- LSP Syntax Highlighting
- Transcription specific code completion
- TTR to XML transformation
- Displaying the XML
- Rendering XML with stylesheets
- Displaying the rendering

TODO: more?


## Known Issues

This is work in progress. Too many issues to be listed here.


## Release Notes

Details can be found in the `CHANGELOG.md` file.

### Upcoming

- LSP Client
- LSP Server
- Language Configuration
- TextMate Syntax Highlighting
