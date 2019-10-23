declare function regexdot(route: string, loose?: boolean): {
	keys: Array<string>,
	pattern: RegExp
}

declare function regexdot(route: RegExp): {
	keys: false,
	pattern: RegExp
}

export default regexdot;
