/**
 * Represents the configuration of a Turing machine parsed from the structured syntax.
 */
export interface TuringMachineConfig {
  /** The starting state of the machine. */
  initialState: string;
  /** The symbol representing a blank cell on the tape. */
  blank: string;
  /** The initial content of the tape as a string. */
  input: string;
  /** A map where keys are state names and values are the transitions for that state. */
  transitions: Map<string, StateTransitions>;
}

/**
 * Represents the set of transitions defined for a single state.
 * Keys are the symbols read from the tape, values are the corresponding transition rules.
 */
export interface StateTransitions {
  [symbol: string]: TransitionRule;
}

/**
 * Defines the actions to take for a specific transition.
 */
export interface TransitionRule {
  /** The symbol to write to the tape (optional, if not provided, the read symbol remains). */
  write?: string;
  /** The direction to move the tape head ('L' for left, 'R' for right, 'N' for no move/halt). */
  move: 'L' | 'R' | 'N';
  /** The next state to transition to. */
  nextState: string;
}

/**
 * Parses a string containing a Turing machine definition in the structured syntax.
 * Extracts the initial state, blank symbol, input tape, and transition rules.
 * @param code The string containing the Turing machine definition.
 * @returns A TuringMachineConfig object representing the parsed machine.
 * @throws May throw an error if the syntax is invalid, although current implementation is lenient.
 */
export const parseStructuredSyntax = (code: string): TuringMachineConfig => {
  const lines = code.split('\n');
  let initialState = 'right'; // Default initial state if not specified
  let blank = '_'; // Default blank symbol if not specified
  let input = '';
  const transitions = new Map<string, StateTransitions>();
  let currentState = ''; // Tracks the current state being parsed

  /**
   * Processes a line defining a transition rule within a state block.
   * @param line The line containing the transition rule.
   * @param state The current state context for this transition.
   */
  const processTransition = (line: string, state: string) => {
    // Match format: `symbol: { options }` or `[symbol1,symbol2]: { options }`
    const match = line.match(/^\s*(?:\[([^\]]+)\]|([^:]+)):\s*(.*)/);
    if (!match) return; // Ignore lines that don't match the transition format

    // Extract symbols (can be a single symbol or a comma-separated list in brackets)
    const symbols = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2].trim()];
    const options = match[3].trim(); // The part within {}

    // Parse the options string to find write, move, and nextState
    const writeMatch = options.match(/write:\s*([^,}\s]+)/);
    const moveMatch = options.match(/([LRN]):\s*([^,}\s]+)/); // Matches L:, R:, or N:

    if (moveMatch) {
      const move = moveMatch[1] as 'L' | 'R' | 'N';
      const nextState = moveMatch[2].trim();
      const write = writeMatch ? writeMatch[1].trim() : undefined; // Optional write symbol

      // Ensure the state exists in the transitions map
      if (!transitions.has(state)) {
        transitions.set(state, {});
      }

      // Add a transition rule for each symbol specified in the list
      for (const symbol of symbols) {
        transitions.get(state)![symbol.trim()] = {
          nextState,
          move,
          write
        };
      }
    } else {
      // Handle cases where the move/nextState part is missing or malformed (optional: add error handling)
      console.warn(`Could not parse move/nextState from options: "${options}" in state "${state}"`);
    }
  };

  // Iterate through each line of the input code
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') continue;

    // Parse top-level directives (input, blank, start state)
    if (line.startsWith('input:')) {
      const match = line.match(/input:\s*['"]([^'"]*)['"]/);
      if (match) input = match[1];
      continue; // Move to the next line
    }

    if (line.startsWith('blank:')) {
      const match = line.match(/blank:\s*['"]([^'"]*)['"]/);
      if (match) blank = match[1];
      continue; // Move to the next line
    }

    if (line.startsWith('start state:')) {
      const match = line.match(/start state:\s*(\w+)/);
      if (match) initialState = match[1].trim();
      continue; // Move to the next line
    }

    // Ignore the 'table:' line itself
    if (line === 'table:') continue;

    // Detect the start of a new state definition (e.g., "right:")
    // Ensure it's not part of a transition rule (doesn't contain '{')
    if (line.endsWith(':') && !line.includes('{')) {
      currentState = line.slice(0, -1).trim(); // Set the current state context
      continue; // Move to the next line
    }

    // If we are inside a state block, parse the line as a potential transition
    if (currentState && (line.includes('{') || line.includes('['))) {
      processTransition(line, currentState);
    }
  }

  // Return the fully parsed configuration
  return {
    initialState,
    blank,
    input,
    transitions
  };
};

/**
 * Parses the state table string (currently assumes structured syntax) and
 * transforms it into the format expected by the Simulator component.
 * @param stateTable The raw string input containing the Turing machine definition.
 * @returns An object containing the flattened list of transitions, the initial tape array, and the initial state name.
 */
export const parseStateTable = (stateTable: string): {
  transitions: any[], // Consider defining a more specific type for the simulator's transition format
  initialTape: string[],
  initialState: string
} => {
  // Log the input for debugging
  // console.log('Parsing state table:', stateTable);

  // Parse the input using the structured syntax parser
  const config = parseStructuredSyntax(stateTable);

  // Log the parsed configuration for debugging
  // console.log('Parsed config:', JSON.stringify({
  //   initialState: config.initialState,
  //   blank: config.blank,
  //   input: config.input,
  //   // Convert Map to object for easier logging
  //   transitions: Object.fromEntries([...config.transitions].map(([k, v]) => [k, v]))
  // }, null, 2));

  // Convert the Map-based transitions into a flat array format required by the simulator
  const transitions: any[] = [];
  config.transitions.forEach((stateTransitions, state) => {
    // console.log(`Processing transitions for state '${state}'`, stateTransitions);
    Object.entries(stateTransitions).forEach(([symbol, rule]) => {
      // Handle cases where multiple symbols are defined like [0,1]
      // Note: The structured parser already handles splitting these, but this ensures robustness
      // If the symbol string contains commas (likely from bracket notation), split it. Otherwise, treat as single symbol.
      const symbols = symbol.includes(',') ? symbol.split(',').map(s => s.trim()) : [symbol];

      for (const readSymbol of symbols) {
        // Use the configured blank symbol if the read symbol is empty (often represents blank in definitions)
        const actualReadSymbol = readSymbol === '' ? config.blank : readSymbol;

        // Determine the symbol to write. Default to the read symbol if 'write' is not specified.
        let writeSymbol = rule.write !== undefined ? rule.write : actualReadSymbol;
        // If write symbol is explicitly empty, use the blank symbol
        if (writeSymbol === '') {
            writeSymbol = config.blank;
        }


        // Add the transition to the flat list
        transitions.push({
          currentState: state,
          readSymbol: actualReadSymbol,
          nextState: rule.nextState,
          writeSymbol: writeSymbol,
          moveDirection: rule.move
        });

        // console.log(`Added transition: ${state} + ${actualReadSymbol} -> ${rule.nextState}, write ${writeSymbol}, move ${rule.move}`);
      }
    });
  });

  // Convert the input string to an array of characters (tape cells)
  let initialTape = config.input ? Array.from(config.input) : [];
  // Provide a default tape if the input is empty
  if (initialTape.length === 0) {
    console.warn("No input tape provided, using default '1011'");
    initialTape = ['1', '0', '1', '1'];
  }

  // console.log('Final transitions:', transitions);

  // Return the data in the format expected by the Simulator component
  return {
    transitions,
    initialTape,
    initialState: config.initialState
  };
};
