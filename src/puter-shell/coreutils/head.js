/*
 * Copyright (C) 2024  Puter Technologies Inc.
 *
 * This file is part of Phoenix Shell.
 *
 * Phoenix Shell is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { Exit } from './coreutil_lib/exit.js';
import { resolveRelativePath } from '../../util/path.js';

export default {
    name: 'head',
    usage: 'head [OPTIONS] [FILE]',
    description: 'Read a file and print the first lines to standard output.\n\n' +
        'Defaults to 10 lines unless --lines is given. ' +
        'If no FILE is provided, or FILE is `-`, read standard input.',
    input: {
        syncLines: true
    },
    args: {
        $: 'simple-parser',
        allowPositionals: true,
        options: {
            lines: {
                description: 'Print the last COUNT lines',
                type: 'string',
                short: 'n',
                valueName: 'COUNT',
            }
        }
    },
    execute: async ctx => {
        const { in_, out, err } = ctx.externs;
        const { positionals, values } = ctx.locals;
        const { filesystem } = ctx.platform;

        if (positionals.length > 1) {
            // TODO: Support multiple files (this is POSIX)
            await err.write('head: Only one FILE parameter is allowed\n');
            throw new Exit(1);
        }
        const relPath = positionals[0] || '-';

        let lineCount = 10;

        if (values.lines) {
            const parsedLineCount = Number.parseFloat(values.lines);
            if (isNaN(parsedLineCount) || ! Number.isInteger(parsedLineCount) || parsedLineCount < 1) {
                await err.write(`head: Invalid number of lines '${values.lines}'\n`);
                throw new Exit(1);
            }
            lineCount = parsedLineCount;
        }

        // TODO: head can stop reading from the input as soon as it completes lineCount lines.
        let lines = [];
        if (relPath === '-') {
            lines = await in_.collect();
        } else {
            const absPath = resolveRelativePath(ctx.vars, relPath);
            const fileData = await filesystem.read(absPath);
            // DRY: Similar logic in wc and tail
            if (fileData instanceof Blob) {
                const arrayBuffer = await fileData.arrayBuffer();
                const fileText = new TextDecoder().decode(arrayBuffer);
                lines = fileText.split(/\n|\r|\r\n/).map(it => it + '\n');
            } else if (typeof fileData === 'string') {
                lines = fileData.split(/\n|\r|\r\n/).map(it => it + '\n');
            } else {
                // ArrayBuffer or TypedArray
                const fileText = new TextDecoder().decode(fileData);
                lines = fileText.split(/\n|\r|\r\n/).map(it => it + '\n');
            }
        }
        if ( lines.length > lineCount ) {
            lines = lines.slice(0, lineCount);
        }

        for ( const line of lines ) {
            await out.write(line);
        }
    }
};
