import { styleText } from "node:util";
import type { Stats } from "webpack";

type ErrorLike = {
  message: string;
  moduleName?: string;
  file?: string;
  loc?: string;
  details?: string;
  stack?: string;
};

export const printArgs = (
  opts: Record<string, unknown>,
  label: string,
): Record<string, unknown> => {
  if (opts.verbose) {
    const options = Object.entries(opts);
    console.log(styleText(["green", "bold"], `${label} options:`));
    options.forEach((opt) => {
      console.log(`- ${styleText(["green", "bold"], opt[0])}: ${opt[1]}`);
    });
  }
  return opts;
};

const logErrors = (
  errors: ErrorLike[],
  gravity: "error" | "warning",
  verbose?: boolean,
): void => {
  errors.forEach((error, i) => {
    console.log(styleText(gravity === "error" ? ["bgRed", "white", "bold"] : ["bgYellow", "white", "bold"], `${i + 1}/${errors.length}:`));
    console.log(styleText([gravity === "error" ? "redBright" : "yellowBright"], ` > ${error.message}`));
    if (error.moduleName) console.log(styleText([gravity === "error" ? "redBright" : "yellowBright"], "Module: "), error.moduleName);
    if (error.file)
      console.log(
        styleText([gravity === "error" ? "redBright" : "yellowBright"], "File: "),
        error.file,
        error.loc ? ` at position ${error.loc}` : "",
      );
    if (error.details) console.log(styleText([gravity === "error" ? "redBright" : "yellowBright"], "Details: "), error.details);
    if (error.stack && verbose) console.log(styleText([gravity === "error" ? "redBright" : "yellowBright"], "Stack: "), error.stack);
  });
};

export const logBuild =
  (
    [resolve, reject]: [(value: Stats) => void, ((reason?: unknown) => void)?],
    options: { verbose?: boolean },
  ) =>
  (err: Error | null, stats?: Stats): void => {
    if (err) {
      console.log(styleText(["bgRed", "white", "bold"], "Webpack Runtime Error"));
      logErrors([err as ErrorLike], "error", options.verbose);
      if (reject) reject(err);
    }

    const info = stats?.toJson();

    if (stats?.hasWarnings() && info?.warnings) {
      console.log(
        styleText(["bgYellow", "white", "bold"], `Webpack Compilation Warning${info.warnings.length > 1 ? "s" : ""}`),
      );
      logErrors(info.warnings as ErrorLike[], "warning", options.verbose);
    }

    if (stats?.hasErrors() && info?.errors) {
      console.log(
        styleText(["bgRed", "white", "bold"], `Webpack Compilation Error${info.errors.length > 1 ? "s" : ""}`),
      );
      logErrors(info.errors as ErrorLike[], "error", options.verbose);
      if (reject) reject(err);
    } else {
      console.log(styleText(["bgGreen", "white", "bold"], "Compiled Successfully!"));
    }
    if (resolve && stats) resolve(stats);
  };
