
# Huffman & LZW Compression Visualizer

A sleek, interactive web application to **visualize how Huffman Coding and LZW Compression algorithms work** step-by-step — built with **Next.js 15**, **Tailwind CSS**, **React D3 Tree**, and smooth animations using **Framer Motion**.

---

## Features

### Compression Algorithm Visualization
- 📊 **Huffman Coding Tree** step-by-step construction
- 🧱 **LZW dictionary build-up** with real-time updates
- 🧠 Interactive encoding/decoding processes with tooltips and transitions

### Modern UI & UX
- 🌙 Theme support via `next-themes`(Only dark mode supported for now)
- 🧩 Responsive design using Tailwind CSS + Shadcn UI
- 📈 Dynamic tree rendering via `react-d3-tree`
- 🎬 Smooth animations with `framer-motion`

### 🛠Dev Tools
- TypeScript-powered

---

## Tech Stack

| Tech                 | Role                                      |
|----------------------|-------------------------------------------|
| **Next.js**          | React-based app framework                 |
| **Tailwind CSS**     | Utility-first styling                     |
| **Shadcn UI**        | Accessible UI primitives                  |
| **Framer Motion**    | Animation library                         |
| **React D3 Tree**    | Tree rendering for Huffman visualization  |
| **Recharts**         | Graphical representation (pending)        |
| **TypeScript**       | Type safety and dev ergonomics            |

---

## Compression Algorithms

### Huffman Coding

**Huffman Coding** is a **lossless data compression algorithm** based on character frequencies. It builds a binary tree (Huffman Tree) where:
- Characters with higher frequencies have **shorter binary codes**
- Characters with lower frequencies have **longer binary codes**

#### Features of Huffman Coding
- 📊 **Frequency-Based**: Uses the frequency of each character to build an optimal prefix tree
- 🌲 **Binary Tree Construction**: Dynamically builds a tree where each leaf is a character
- 🔗 **Prefix-Free Codes**: No code is a prefix of another; ensures unambiguous decoding
- 💡 **Greedy Algorithm**: Always combines the two least frequent nodes
- 🚀 **Efficient for texts with skewed frequency distribution**

### Lempel–Ziv–Welch (LZW) Compression

**LZW** is a **dictionary-based** lossless compression algorithm. It works by:
- Scanning sequences of characters
- Storing new sequences in a **dynamic dictionary**
- Replacing repeated sequences with **dictionary indexes**

#### Features of LZW Compression
- 📘 **No Need to Transmit Dictionary**: Both encoder and decoder build it identically on the fly
- 🧱 **Efficient for Repeating Patterns**: Great for structured, repetitive data (e.g., XML, logs)
- 🔄 **Dynamic Dictionary Building**: Grows during encoding, allowing for efficient handling of long strings


## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/KGLikith/huffman-lzw-visualizer.git
   cd huffman-lzw-visualizer
   npm i
   npm run build
   npm start
