#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { parse, resolve } from "path";
import diffHTML from "./js/htmldiff";

// Argument count.
const argc: number = process.argv.length;
// Name of the "executable", e. g. `htmldiff-cli`.
const cli: string = parse(__filename).name;
// Optional class attribute name for `<ins>` and `<del>` tags.
let className: string | null = null;
// Optional prefix for data-operation-index attribute.
let dataPrefix: string | null = null;
// Optional list of atomic tags.
let atomicTags: string | null = null;

/**
 * Output usage info and version on the console.
 */
function printUsage(): void {
    const usage =
`${cli} v0.9.4

Usage: ${cli} beforeFile afterFile diffedFile [Options]

beforeFile:
  An HTML input file in its original form.

afterFile:
  An HTML input file, based on beforeFile but with changes.

diffedFile:
  Name of the diffed HTML output file. All differences between beforeFile
  and afterFile will be surrounded with <ins> and <del> tags. If diffedFile
  is - (minus) the result will be written with console.log() to stdout.

Options:

-c className (optional):
  className will be added as a class attribute on every <ins> and <del> tag.

-p dataPrefix (optional):
  The data prefix to use for data attributes. The operation index data
  attribute will be named "data-$\{dataPrefix-}operation-index". If not
  used, the default attribute name "data-operation-index" will be added
  on every <ins> and <del> tag. The value of this attribute is an auto
  incremented counter.

-t atomicTags (optional):
  Comma separated list of tag names. The list has to be in the form
  "tag1,tag2,..." e. g. "head,script,style". An atomic tag is one whose
  child nodes should not be compared - the entire tag should be treated
  as one token. This is useful for tags where it does not make sense to
  insert <ins> and <del> tags. If not used, this default list will be used:
  "iframe,object,math,svg,script,video,head,style,a,img".`;
    console.log(usage);
}

/**
 * Read content of a file and return content as a string. The encoding of the file is considered to
 * be in UTF-8 format by default.
 * @param fileName The name of the file to be read.
 * @returns The content of 'fileName' as a string. An empty string is considered to be an error
 * which will be logged.
 */
function readFileContent(fileName: string): string {
    try {
        const result = readFileSync(resolve(fileName), "utf-8");
        if (result === "") {
            console.error(`File "${fileName}" is empty.`);
        }
        return result;
    } catch (error) {
        console.error(`Couldn't read file "${fileName}"\n${error}`);
        return "";
    }
}

/**
 * Set the value of one the variables for the `diff` function based on a given switch name. The
 * function fails (return false) if the value of the variable is already set (duplicate switch) or
 * the switch name is unknown.
 * @param name The name of the switch (one of `-c`, `-p` or `-t`)
 * @param value The value of the switch given on the command line.
 * @returns `true` if the switch could be resolved, otherwise `false`.
 */
function resolveSwitch(name: string, value: string): boolean {
    switch (name) {
        case "-c":
            if (className) { // Already assigned, double usage of switch
                return false;
            }
            className = value;
            return true;

        case "-p":
            if (dataPrefix) {
                return false;
            }
            dataPrefix = value;
            return true;

        case "-t":
            if (atomicTags) {
                return false;
            }
            atomicTags = value;
            return true;
    }
    // Unknown switch
    return false;
}

// Invalid argc
const validArgc: number[] = [5, 7, 9, 11];
if (validArgc.indexOf(argc) === -1) {
    printUsage();
    process.exit(1);
}

// Resolve switches
if (argc > 6) {
    if (!resolveSwitch(process.argv[5], process.argv[6])) {
        printUsage();
        process.exit(1);
    }
}
if (argc > 8) {
    if (!resolveSwitch(process.argv[7], process.argv[8])) {
        printUsage();
        process.exit(1);
    }
}
if (argc > 10) {
    if (!resolveSwitch(process.argv[9], process.argv[10])) {
        printUsage();
        process.exit(1);
    }
}

// Execute diff
const beforeFile: string = readFileContent(process.argv[2]);
if (!beforeFile) {
     process.exit(1);
}
const afterFile: string = readFileContent(process.argv[3]);
if (!afterFile) {
    process.exit(1);
}
const diffedResult: string = diffHTML(beforeFile, afterFile, className, dataPrefix, atomicTags);

if (/* output file */process.argv[4] === "-") {
    console.log(diffedResult);
} else {
    writeFileSync(resolve(process.argv[4]), diffedResult);
}
