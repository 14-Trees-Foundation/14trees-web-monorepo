import chalk from 'chalk';

const success = (...args: any[]) => console.log(...args.map(chalk.green));
const info = (...args: any[]) => console.log(...args.map(chalk.blue));
const log = console.log
const warning = chalk.hex('#FFA500'); // Orange color
const warn = (...args: any[]) => console.log(...args.map(warning));
const error = (...args: any[]) => console.log(...args.map(chalk.bold.red));

export {
    success,
    info,
    log,
    warn,
    error,
}