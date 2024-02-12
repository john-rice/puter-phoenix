import path from "path-browserify";

export default {
    name: 'cd',
    args: {
        $: 'simple-parser',
        allowPositionals: true
    },
    execute: async ctx => {
        // ctx.params to access processed args
        // ctx.args to access raw args
        const { positionals, values } = ctx.locals;
        const { filesystem } = ctx.platform;

        let [ target ] = positionals;

        if ( ! target.startsWith('/') ) {
            target = path.resolve(ctx.vars.pwd, target);
        }

        const result = await filesystem.readdir(target);

        if ( result.$ === 'error' ) {
            ctx.externs.err.write('cd: error: ' + result.message + '\n');
            return;
        }

        ctx.externs.out.write(result.path + '\n');
        ctx.externs.out.write('TEST\n');

        ctx.vars.pwd = target;
    }
};
