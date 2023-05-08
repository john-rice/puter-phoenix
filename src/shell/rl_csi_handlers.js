/*
## this source file
- maps: CSI (Control Sequence Introducer) sequences
- to:   expected functionality in the context of readline

## relevant articles
- [ECMA-48](https://www.ecma-international.org/wp-content/uploads/ECMA-48_5th_edition_june_1991.pdf)
- [Wikipedia](https://en.wikipedia.org/wiki/ANSI_escape_code)
*/

import { ANSIContext, getActiveModifiersFromXTerm } from "./ANSIContext";
import { findNextWord } from "./rl_words";

// TODO: potentially include metadata in handlers

// --- util ---
const cc = chr => chr.charCodeAt(0);

const CHAR_DEL = 127;
const CHAR_ESC = 0x1B;

const { consts } = ANSIContext;

// --- convenience function decorators ---
const CSI_INT_ARG = delegate => ctx => {
    const controlSequence = ctx.locals.controlSequence;

    let str = new TextDecoder().decode(controlSequence);

    // Detection of modifier keys like ctrl and shift
    if ( str.includes(';') ) {
        const parts = str.split(';');
        str = parts[0];
        const modsStr = parts[parts.length - 1];
        let modN = Number.parseInt(modsStr);
        const mods = getActiveModifiersFromXTerm(modN);
        for ( const k in mods ) ctx.locals[k] = mods[k];
    }

    let num = str === '' ? 1 : Number.parseInt(str);
    if ( Number.isNaN(num) ) num = 0;

    ctx.locals.num = num;

    return delegate(ctx);
};

// --- PC-Style Function Key handles (see `~` final byte in CSI_HANDLERS) ---
export const PC_FN_HANDLERS = {
    // delete key
    3: ctx => {
        const { vars } = ctx;
        const deleteSequence = new Uint8Array([
            consts.CHAR_ESC, consts.CHAR_CSI, cc('P')
        ]);
        vars.result = vars.result.slice(0, vars.cursor) +
            vars.result.slice(vars.cursor + 1);
        ctx.externs.out.write(deleteSequence);
    }
};

// --- CSI handlers: this is the last definition in this file ---
export const CSI_HANDLERS = {
    // cursor back
    [cc('D')]: CSI_INT_ARG(ctx => {
        if ( ctx.vars.cursor === 0 ) {
            return;
        }
        if ( ctx.locals.ctrl ) {
            // TODO: temporary inaccurate implementation
            const txt = ctx.vars.result;
            const ind = findNextWord(txt, ctx.vars.cursor, true);
            const diff = ctx.vars.cursor - ind;
            ctx.vars.cursor = ind;
            const moveSequence = new Uint8Array([
                consts.CHAR_ESC, consts.CHAR_CSI,
                ...(new TextEncoder().encode('' + diff)),
                cc('D')
            ]);
            ctx.externs.out.write(moveSequence);
            return;
        }
        ctx.vars.cursor -= ctx.locals.num;
        ctx.locals.doWrite = true;        
    }),
    // cursor forward
    [cc('C')]: CSI_INT_ARG(ctx => {
        console.log('!@#', ctx.vars.cursor, ctx.vars.result)
        if ( ctx.vars.cursor >= ctx.vars.result.length ) {
            return;
        }
        if ( ctx.locals.ctrl ) {
            // TODO: temporary inaccurate implementation
            const txt = ctx.vars.result;
            const ind = findNextWord(txt, ctx.vars.cursor);
            const diff = ind - ctx.vars.cursor;
            ctx.vars.cursor = ind;
            const moveSequence = new Uint8Array([
                consts.CHAR_ESC, consts.CHAR_CSI,
                ...(new TextEncoder().encode('' + diff)),
                cc('C')
            ]);
            ctx.externs.out.write(moveSequence);
            return;
        }
        ctx.vars.cursor += ctx.locals.num;
        ctx.locals.doWrite = true;        
    }),
    // PC-Style Function Keys
    [cc('~')]: CSI_INT_ARG(ctx => {
        if ( ! PC_FN_HANDLERS.hasOwnProperty(ctx.locals.num) ) {
            console.error(`unrecognized PC Function: ${ctx.locals.num}`);
            return;
        }
        PC_FN_HANDLERS[ctx.locals.num](ctx);
    }),
    // Home
    [cc('H')]: ctx => {
        const amount = ctx.vars.cursor;
        ctx.vars.cursor = 0;
        const moveSequence = new Uint8Array([
            consts.CHAR_ESC, consts.CHAR_CSI,
            ...(new TextEncoder().encode('' + amount)),
            cc('D')
        ]);
        ctx.externs.out.write(moveSequence);
    },
    // End
    [cc('F')]: ctx => {
        const amount = ctx.vars.result.length - ctx.vars.cursor;
        ctx.vars.cursor = ctx.vars.result.length;
        const moveSequence = new Uint8Array([
            consts.CHAR_ESC, consts.CHAR_CSI,
            ...(new TextEncoder().encode('' + amount)),
            cc('C')
        ]);
        ctx.externs.out.write(moveSequence);
    },
};
