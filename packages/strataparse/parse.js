export class Parser {
    constructor ({
        impl,
        assign,
    }) {
        this.impl = impl;
        this.assign = assign ?? {};
    }
    parse (lexer) {
        const unadaptedResult = this.impl.parse(lexer);
        const pr = unadaptedResult instanceof ParseResult
            ? unadaptedResult : new ParseResult(unadaptedResult);
        if ( pr.status === ParseResult.VALUE ) {
            pr.value = {
                ...pr.value,
                ...this.assign,
            };
        }
        return pr;
    }
}

export class ParseResult {
    static UNRECOGNIZED = { name: 'unrecognized' };
    static VALUE = { name: 'value' };
    static INVALID = { name: 'invalid' };
    constructor (value, opt_status) {
        if (
            value === ParseResult.UNRECOGNIZED ||
            value === ParseResult.INVALID
        ) {
            this.status = value;
            return;
        }
        this.status = opt_status ?? (
            value === undefined
                ? ParseResult.UNRECOGNIZED
                : ParseResult.VALUE
        );
        this.value = value;
    }
}

class ConcreteSyntaxParserDecorator {
    constructor (delegate) {
        this.delegate = delegate;
    }
    parse (lexer, ...a) {
        const start = lexer.seqNo;
        const result = this.delegate.parse(lexer, ...a);
        if ( result.status === ParseResult.VALUE ) {
            const end = lexer.seqNo;
            result.value.$cst = { start, end };
        }
        return result;
    }
}

class RememberSourceParserDecorator {
    constructor (delegate) {
        this.delegate = delegate;
    }
    parse (lexer, ...a) {
        const start = lexer.seqNo;
        const result = this.delegate.parse(lexer, ...a);
        if ( result.status === ParseResult.VALUE ) {
            const end = lexer.seqNo;
            result.value.$source = lexer.reach(start, end);
        }
        return result;
    }
}

export class ParserFactory {
    constructor () {
        this.concrete = false;
        this.rememberSource = false;
    }
    decorate (obj) {
        if ( this.concrete ) {
            obj = new ConcreteSyntaxParserDecorator(obj);
        }
        if ( this.rememberSource ) {
            obj = new RememberSourceParserDecorator(obj);
        }

        return obj;
    }
    create (cls, parserParams, resultParams) {
        parserParams = parserParams ?? {};

        resultParams = resultParams ?? {};
        resultParams.assign = resultParams.assign ?? {};
        
        const impl = new cls(parserParams);
        const parser = new Parser({
            impl,
            assign: resultParams.assign
        });
        
        // return parser;
        return this.decorate(parser);
    }
}

export class SingleParserFactory {
    create () {
        throw new Error('abstract create() must be implemented');
    }
}

export class AcceptParserUtil {
    static adapt (parser) {
        if ( parser === undefined ) return undefined;
        if ( parser instanceof SingleParserFactory ) {
            parser = parser.create();
        }
        if ( ! (parser instanceof Parser) ) {
            parser = new Parser({ impl: parser });
        }
        return parser;
    }
}