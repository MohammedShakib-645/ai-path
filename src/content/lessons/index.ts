// Phase 4 — authored MDX lessons. Keyed by the EXACT curriculum lesson title so
// /lesson/[lessonId] finds them regardless of generated lesson ids shifting.
import type { ComponentType } from "react";
import type { MDXContent } from "mdx/types";

import PythonBasics from "./python-basics.mdx";
import Conditions from "./conditions.mdx";
import Loops from "./loops.mdx";
import Functions from "./functions.mdx";
import Lists from "./lists.mdx";
import Comprehensions from "./comprehensions.mdx";
import LinearRegression from "./linear-regression.mdx";
import Overfitting from "./overfitting.mdx";
import Attention from "./attention.mdx";
import PromptEngineering from "./prompt-engineering.mdx";

export interface AuthoredLesson {
  Component: ComponentType<Parameters<MDXContent>[0]>;
  /** One honest line about what this editorial lesson covers. */
  blurb: string;
}

/** Authored (verified) lessons render instantly — no AI round-trip, no flake. */
export const AUTHORED_LESSONS: Record<string, AuthoredLesson> = {
  "Python Basics & Syntax": { Component: PythonBasics, blurb: "Variables, types & printing — the first code you'll ever write for AI." },
  "Conditions": { Component: Conditions, blurb: "if / elif / else — how programs make decisions." },
  "Loops": { Component: Loops, blurb: "for, while, break/continue — repetition without copy-paste." },
  "Functions": { Component: Functions, blurb: "def, return, defaults, scope — code you can reuse." },
  "Lists": { Component: Lists, blurb: "Indexing, slicing, methods and the copying trap." },
  "Comprehensions": { Component: Comprehensions, blurb: "Whole lists in one line: filter, map, dict and set forms." },
  "Linear Regression": { Component: LinearRegression, blurb: "Fit a line, measure error, train/test like a professional." },
  "Overfitting vs Underfitting": { Component: Overfitting, blurb: "Spot the gap between train and test — and the fixes that work." },
  "Attention Mechanism": { Component: Attention, blurb: "QKV, self-attention and the block under every Transformer." },
  "Prompt Engineering": { Component: PromptEngineering, blurb: "Role, task, format, guardrails — instructions LLMs can't misread." },
};

export const AUTHORED_COUNT = Object.keys(AUTHORED_LESSONS).length;
