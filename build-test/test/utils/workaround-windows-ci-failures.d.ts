import { Suite } from "mocha";
/**
 * Hardhat Network tests that involve forking are much more brittle on windows
 * for some reason, so we retry them a few times.
 */
export declare function workaroundWindowsCiFailures(this: Suite, { isFork }: {
    isFork: boolean;
}): void;
//# sourceMappingURL=workaround-windows-ci-failures.d.ts.map