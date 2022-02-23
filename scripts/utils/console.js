const chalk = require('chalk');

exports.printArgs = (opts, label) => {
	const options = Object.entries(opts);
	console.log(chalk.green.bold(`${label} options:`));
	options.forEach(opt => {
		console.log(`- ${chalk.green.bold(opt[0])}: ${opt[1]}`)
	});
	return opts;
}

const logErrors = (errors, gravity, verbose) => {
	const title = gravity === 'error' ? chalk.bgRed.white : chalk.bgYellow.white;
	const message = gravity === 'error' ? chalk.redBright : chalk.yellowBright;
	errors.forEach((error, i) => {
		console.log(title(`${i + 1}/${errors.length}:`));
		console.log(message(` > ${error.message}`));
		if (error.moduleName) console.log(message('Module: '), error.moduleName);
		if (error.file) console.log(message('File: '), error.file, error.loc ? ` at position ${error.loc}` : '');
		if (error.details) console.log(message('Details: '), error.details);
		if (error.stack && verbose) console.log(message('Stack: '), error.stack);
	});
}

exports.logBuild =
	([resolve, reject], options) =>
	(err, stats) => {
		if (err) {
			console.log(chalk.bgRed.white.bold('Webpack Runtime Error'));
			logErrors([err], 'error', options.verbose);
			if (reject) reject(err);
		}

		const info = stats.toJson();

		if (stats.hasWarnings()) {
			console.log(chalk.bgYellow.white.bold(`Webpack Compilation Warning${info.warnings.length > 1 ? 's' : ''}`));
			logErrors(info.warnings, 'warning', options.verbose);
		}

		if (stats.hasErrors()) {
			console.log(
				chalk.bgRed.white.bold(`Webpack Compilation Error${info.errors.length > 1 ? 's' : ''}`)
			);
			logErrors(info.errors, 'error', options.verbose);
			if (reject) reject(err);
		} else {
			console.log(chalk.bgBlue.white.bold('Compiled Successfully!'));
		}
		if (resolve) resolve(stats);
	};
