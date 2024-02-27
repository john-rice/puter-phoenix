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
import assert from 'assert';
import { MakeTestContext } from './harness.js'
import builtins from '../../src/puter-shell/coreutils/__exports__.js';

export const runWcTests = () => {
    describe('wc', function () {
        const testCases = [
            {
                description: 'can read from stdin when given `-`',
                positionals: ['-'],
                stdin: 'Well hello friends!',
                expectedStdout: '0 3 19 -\n',
            },
            {
                description: 'reads from stdin when given no arguments',
                positionals: [],
                stdin: 'Well hello friends!',
                expectedStdout: '0 3 19\n',
            },
            {
                description: 'handles empty stdin',
                positionals: ['-'],
                stdin: '',
                expectedStdout: '0 0 0 -\n',
            },
            {
                description: 'counts newlines',
                positionals: ['-'],
                stdin: 'Well\nhello\nfriends!\n',
                expectedStdout: '3 3 20 -\n',
            },
            {
                description: '-lwc produces the default output',
                options: { bytes: true, lines: true, words: true },
                positionals: ['-'],
                stdin: 'Well\nhello\nfriends!\n',
                expectedStdout: '3 3 20 -\n',
            },
            {
                description: '-l outputs only lines',
                options: { lines: true },
                positionals: ['-'],
                stdin: 'Well\nhello\nmy friends!\n',
                expectedStdout: '3 -\n',
            },
            {
                description: '-w outputs only words',
                options: { words: true },
                positionals: ['-'],
                stdin: 'Well\nhello\nmy friends!\n',
                expectedStdout: '4 -\n',
            },
            {
                description: '-c outputs only bytes',
                options: { bytes: true },
                positionals: ['-'],
                stdin: '🖥️ Well\nhello\nmy friends!\n',
                expectedStdout: '31 -\n',
            },
            {
                description: '-m outputs only characters',
                options: { chars: true },
                positionals: ['-'],
                stdin: '🖥️ Well\nhello\nmy friends!\n',
                expectedStdout: '27 -\n',
            },
            {
                description: '-lwmc outputs everything',
                options: { bytes: true, chars: true, lines: true, words: true },
                positionals: ['-'],
                stdin: '🖥️ Well\nhello\nmy friends!\n',
                expectedStdout: '3 5 27 31 -\n',
            },
            // TODO: Test with files once the harness supports that.
        ];
        for (const { description, options, positionals, stdin, expectedStdout } of testCases) {
            it(description, async () => {
                let ctx = MakeTestContext(builtins.wc, { positionals, values: options, stdinInputs: [stdin] });
                try {
                    const result = await builtins.wc.execute(ctx);
                    assert.equal(result, undefined, 'should exit successfully, returning nothing');
                } catch (e) {
                    assert.fail(e);
                }
                assert.equal(ctx.externs.out.output, expectedStdout, 'wrong output written to stdout');
                assert.equal(ctx.externs.err.output, '', 'nothing should be written to stderr');
            });
        }
    });
}