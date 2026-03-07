---
name: md-to-word
description: Convert markdown documents to Word (.docx) files using the MarkMyWord CLI. Use when users ask to convert markdown to Word, generate Word documents from .md files, or transform markdown content into .docx format. Triggers include requests like "convert this md to word", "generate a word doc from this file", "make a docx from markdown".
---

# Markdown to Word Conversion

Convert markdown files to Word documents using the `markmyword` CLI.

## Prerequisites

Install the CLI globally:
```bash
dotnet tool install --global SpecWorks.MarkMyWord.CLI
```

## Usage

**Basic conversion** (output filename matches input):
```bash
markmyword convert -i document.md
```

**Specify output file:**
```bash
markmyword convert -i input.md -o output.docx
```

**Custom font and size:**
```bash
markmyword convert -i document.md --font "Times New Roman" --font-size 12
```

**Force overwrite existing file:**
```bash
markmyword convert -i document.md -o output.docx --force
```

## CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--input` | `-i` | Input markdown file path (required) |
| `--output` | `-o` | Output .docx file path (defaults to input filename) |
| `--font` | `-f` | Default font name |
| `--font-size` | `-s` | Default font size (6-72 points) |
| `--style` | | Path to JSON style configuration file |
| `--force` | | Overwrite output file if it exists |
| `--verbose` | `-v` | Enable verbose output |
