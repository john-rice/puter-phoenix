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
// TODO: Detect ANSI escape sequences in the text and treat them as 0 width?
// TODO: Ensure this works with multi-byte characters (UTF-8)
export const wrapText = (text, width) => {
    const whitespaceChars = ' \t'.split('');
    const isWhitespace = c => {
        return whitespaceChars.includes(c);
    };

    // If width was invalid, just return the original text as a failsafe.
    if (typeof width !== 'number' || width < 1)
        return [text];

    const lines = [];
    let currentLine = '';
    const splitWordIfTooLong = (word) => {
        while (word.length > width) {
            lines.push(word.substring(0, width - 1) + '-');
            word = word.substring(width - 1);
        }

        currentLine = word;
    };

    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        // Handle special characters
        if (char === '\n') {
            lines.push(currentLine.trimEnd());
            currentLine = '';
            // Don't skip whitespace after a newline, to allow for indentation.
            continue;
        }
        // TODO: Handle \t?
        if (/\S/.test(char)) {
            // Grab next word
            let word = char;
            while ((i+1) < text.length && /\S/.test(text[i + 1])) {
                word += text[i+1];
                i++;
            }
            if (currentLine.length === 0) {
                splitWordIfTooLong(word);
                continue;
            }
            if ((currentLine.length + word.length) > width) {
                // Next line
                lines.push(currentLine.trimEnd());
                splitWordIfTooLong(word);
                continue;
            }
            currentLine += word;
            continue;
        }

        currentLine += char;
        if (currentLine.length >= width) {
            lines.push(currentLine.trimEnd());
            currentLine = '';
            // Skip whitespace at end of line.
            while (isWhitespace(text[i + 1])) {
                i++;
            }
            continue;
        }
    }
    if (currentLine.length >= 0) {
        lines.push(currentLine);
    }

    return lines;
};