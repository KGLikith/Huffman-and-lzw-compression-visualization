export interface TreeNode {
  char?: string;
  frequency: number;
  left: TreeNode | null;
  right: TreeNode | null;
  code?: string;
  id?: string;
}

export function measureHuffmanFrequency(text: string): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const char of text) {
    const count = frequencies.get(char) || 0;
    frequencies.set(char, count + 1);
  }

  return frequencies;
}

export function buildHuffmanTreeWithSteps(frequencies: Map<string, number>): {
  tree: TreeNode | null;
  steps: Array<{
    queue: TreeNode[];
    combined: TreeNode | null;
    iteration: number;
  }>;
} {
  if (frequencies.size === 0) return { tree: null, steps: [] };

  const initialNodes: TreeNode[] = Array.from(frequencies.entries()).map(
    ([char, frequency], index) => ({
      char,
      frequency,
      left: null,
      right: null,
      id: `leaf-${index}-${char}`,
    })
  );

  const steps: Array<{
    queue: TreeNode[];
    combined: TreeNode | null;
    iteration: number;
  }> = [
    {
      queue: [...initialNodes].sort((a, b) => a.frequency - b.frequency),
      combined: null,
      iteration: 0,
    },
  ];

  if (initialNodes.length === 1) {
    return {
      tree: {
        char: initialNodes[0].char,
        frequency: initialNodes[0].frequency,
        left: null,
        right: null,
        id: initialNodes[0].id,
      },
      steps,
    };
  }

  const nodes = [...initialNodes];
  let iteration = 1;

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency);

    const left = nodes.shift()!;
    const right = nodes.shift()!;

    const parent: TreeNode = {
      frequency: left.frequency + right.frequency,
      left,
      right,
      id: `internal-${iteration}`,
    };

    nodes.push(parent);

    steps.push({
      queue: [...nodes].sort((a, b) => a.frequency - b.frequency),
      combined: {
        ...parent,
        left: { ...left },
        right: { ...right },
      },
      iteration,
    });
    iteration++;
  }

  return { tree: nodes[0], steps };
}

export function generateHuffmanCodes(
  tree: TreeNode | null
): Map<string, string> {
  const codes = new Map<string, string>();

  function traverse(node: TreeNode | null, code = "") {
    if (!node) return;

    if (node.char !== undefined) {
      codes.set(node.char, code);
      node.code = code;
      return;
    }

    // left => 0
    traverse(node.left, code + "0");

    // right => 1
    traverse(node.right, code + "1");
  }

  traverse(tree);
  return codes;
}

export function encodeText(text: string, codes: Map<string, string>): string {
  let encoded = "";

  for (const char of text) {
    const code = codes.get(char);
    if (code) {
      encoded += code;
    }
  }

  return encoded;
}

export function decodeText(encoded: string, tree: TreeNode | null): string {
  if (!tree || !encoded) return "";

  let decoded = "";
  let current = tree;

  for (const bit of encoded) {
    if (bit === "0") {
      current = current.left!;
    } else if (bit === "1") {
      current = current.right!;
    }

    if (current.char !== undefined) {
      decoded += current.char;
      current = tree;
    }
  }

  return decoded;
}

export const downloadAsFile = (filename: string, content: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for Firefox
  element.click();
};