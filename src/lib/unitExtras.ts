/**
 * Real per-unit learning extras: cheat sheets (curated, accurate syntax
 * references) and external resources (official documentation & trusted
 * practice sites only — every URL is a real, stable page).
 * No placeholders: if a unit has no trustworthy link, it is omitted.
 */

export interface CheatSection {
  h: string;
  rows: string[];
}

export interface Resource {
  label: string;
  url: string;
  kind: "docs" | "practice" | "article";
}

export const UNIT_EXTRAS: Record<number, { cheat: CheatSection[]; resources: Resource[] }> = {
  1: {
    cheat: [
      { h: "Variables & assignment", rows: ["name = 'Ada'  # no keyword, dynamic typing", "x = y = 0  # chained", "x += 1  # augmented", "a, b = 1, 2  # unpacking", "type(x)  # <class 'int'>"] },
      { h: "Basic types", rows: ["int  float  str  bool  None", "int('42')  str(3.14)  float('2.5')", "f'{x:.2f}'  # f-string formatting", "len(s)  # length of str/list"] },
      { h: "Input / Output", rows: ["print('hi', x, sep=' ')", "name = input('Name: ')  # returns str", "x = int(input('n: '))  # parse number", "print(x, end=' ')"] },
      { h: "Comments", rows: ["# one line", "'''multi-line", "docstring'''", "# docstrings: help(func)"] },
    ],
    resources: [
      { label: "The official Python Tutorial", url: "https://docs.python.org/3/tutorial/", kind: "docs" },
      { label: "First Steps with Python", url: "https://docs.python.org/3/tutorial/introduction.html", kind: "docs" },
      { label: "Official Python Cheatsheet", url: "https://docs.python.org/3/tutorial/cheatsheet.html", kind: "docs" },
      { label: "W3Schools Python — interactive practice", url: "https://www.w3schools.com/python/", kind: "practice" },
    ],
  },
  2: {
    cheat: [
      { h: "Numbers", rows: ["+  -  *  /  //  %  **", "round(pi, 2)", "int(3.9)  # truncates → 3", "0b1010  0xFF  0o17  # literals"] },
      { h: "Strings", rows: ["s[0]  s[-1]  s[1:3]  # slices", "s.lower()  s.upper()  s.strip()", "s.split(',')  '-'.join(lst)", "s.replace('a', 'b')", "f'{name} is {age}'"] },
      { h: "Truthiness", rows: ["falsy: 0  ''  []  {}  ()  None", "bool('0')  # True — non-empty str", "if s:  # empty check"] },
      { h: "Type tools", rows: ["isinstance(x, int)", "type(x)", "int('10')  float('1.5')", "repr(x)  # quoted debug form"] },
    ],
    resources: [
      { label: "Built-in Types (str, int, list…)", url: "https://docs.python.org/3/library/stdtypes.html", kind: "docs" },
      { label: "Strings HOW TO", url: "https://docs.python.org/3/howto/strings.html", kind: "docs" },
      { label: "String formatting (minilanguage)", url: "https://docs.python.org/3/library/string.html", kind: "docs" },
      { label: "W3Schools — Python strings", url: "https://www.w3schools.com/python/python_strings.asp", kind: "practice" },
    ],
  },
  3: {
    cheat: [
      { h: "Comparisons & logic", rows: ["==  !=  <  >  <=  >=", "and  or  not", "0 <= x < 10  # chained", "is / is not  # identity"] },
      { h: "if / elif / else", rows: ["if cond:", "elif other:", "else:", "x if cond else y  # ternary"] },
      { h: "Loops", rows: ["for i in range(5):  # 0..4", "for k, v in d.items():", "while cond:", "break  continue  for…else"] },
      { h: "Comprehensions", rows: ["[f(x) for x in xs if p(x)]", "{k: v for ...}", "{x for x in xs}  # set", "(x*2 for x in xs)  # generator"] },
    ],
    resources: [
      { label: "Control Flow (official)", url: "https://docs.python.org/3/tutorial/controlflow.html", kind: "docs" },
      { label: "PEP 8 — Style Guide", url: "https://peps.python.org/pep-0008/", kind: "docs" },
      { label: "CodingBat — condition drills", url: "https://codingbat.com/python", kind: "practice" },
      { label: "W3Schools — Python conditions", url: "https://www.w3schools.com/python/python_conditions.asp", kind: "practice" },
    ],
  },
  4: {
    cheat: [
      { h: "def & return", rows: ["def f(a, b=1):", "return x  # None if omitted", "f(1)  f(a=1)  # positional / keyword", "*args  **kwargs  # pack extras"] },
      { h: "Scope & defaults", rows: ["LEGB: Local→Enclosing→Global→Built-in", "def f(items=[])  # ⚠ mutable default trap", "use items=None then items = items or []"] },
      { h: "Lambdas & sorting", rows: ["map(f, xs)  filter(p, xs)", "sorted(xs, key=lambda x: x[1])", "lambda x: x * 2", "print(*map(str, xs))  # unpack"] },
      { h: "Useful built-ins", rows: ["enumerate(xs)  # (i, value)", "zip(a, b)  # pair up", "any(xs)  all(xs)", "sum(xs, start=0)"] },
    ],
    resources: [
      { label: "Defining functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions", kind: "docs" },
      { label: "Built-in functions (len, range, zip…)", url: "https://docs.python.org/3/library/functions.html", kind: "docs" },
      { label: "functools (lru_cache, partial…)", url: "https://docs.python.org/3/library/functools.html", kind: "docs" },
      { label: "W3Schools — Python functions", url: "https://www.w3schools.com/python/python_functions.asp", kind: "practice" },
    ],
  },
  5: {
    cheat: [
      { h: "Lists", rows: ["append  insert  remove  pop", "xs.sort() (in-place) vs sorted(xs)", "xs[::-1]  # reversed copy", "xs[1:3]  xs.insert(i, v)"] },
      { h: "Dicts", rows: ["d.get(k, default)", "d.keys()  d.values()  d.items()", "d[k]  # KeyError if missing", "{**d1, **d2}  # merge"] },
      { h: "Sets", rows: ["a | b  a & b  a - b  # union/diff", "set(lst)  # dedupe, O(1) lookup", "x in s  # fast membership"] },
      { h: "Tuples & stdlib", rows: ["t = (1, 2)  # immutable, hashable", "from collections import Counter, deque, defaultdict", "deque(maxlen=10)  # bounded queue", "defaultdict(list)  # auto-default value"] },
    ],
    resources: [
      { label: "Data Structures (official)", url: "https://docs.python.org/3/tutorial/datastructures.html", kind: "docs" },
      { label: "collections module", url: "https://docs.python.org/3/library/collections.html", kind: "docs" },
      { label: "dataclasses", url: "https://docs.python.org/3/library/dataclasses.html", kind: "docs" },
      { label: "Sorting HOW TO", url: "https://docs.python.org/3/howto/sorting.html", kind: "docs" },
    ],
  },
  6: {
    cheat: [
      { h: "Project setup", rows: ["python -m venv .venv", "source .venv/bin/activate", "  (Windows: .venv\\Scripts\\activate)", "pip install requests", "pip freeze > requirements.txt"] },
      { h: "Structure", rows: ["main.py  # entry point", "src/  # package code", "README.md  # what & why", ".gitignore  # venv, caches"] },
      { h: "Run safely", rows: ["if __name__ == '__main__':", "  main()", "python -m mypkg.mod  # module run", "python -m pip install -e ."] },
      { h: "Ship checklist", rows: ["1. one real feature working", "2. tested with real input", "3. README with example", "4. commit small, commit often"] },
    ],
    resources: [
      { label: "Python Tutorial index", url: "https://docs.python.org/3/tutorial/", kind: "docs" },
      { label: "Virtual Environments & venv", url: "https://docs.python.org/3/tutorial/venv.html", kind: "docs" },
      { label: "PEP 8 — Style Guide", url: "https://peps.python.org/pep-0008/", kind: "docs" },
      { label: "CodingBat — keep practising", url: "https://codingbat.com/python", kind: "practice" },
    ],
  },
  7: {
    cheat: [
      { h: "class basics", rows: ["class Dog:", "  def __init__(self, name):", "    self.name = name", "d = Dog('Rex')"] },
      { h: "Methods", rows: ["def bark(self): ...", "__str__  # user-facing print", "__repr__  # debug print", "__eq__  __len__  __getitem__"] },
      { h: "Inheritance", rows: ["class Puppy(Dog):", "  super().__init__(name)", "isinstance(p, Dog)  # True", "method override + super()"] },
      { h: "Modern style", rows: ["@property  # getter as attribute", "@dataclass  # auto __init__/__eq__", "Class attrs vs self attrs", "Duck typing > isinstance spam"] },
    ],
    resources: [
      { label: "Classes (official tutorial)", url: "https://docs.python.org/3/tutorial/classes.html", kind: "docs" },
      { label: "dataclasses", url: "https://docs.python.org/3/library/dataclasses.html", kind: "docs" },
      { label: "property() built-in", url: "https://docs.python.org/3/library/functions.html#property", kind: "docs" },
      { label: "W3Schools — Python classes", url: "https://www.w3schools.com/python/python_classes.asp", kind: "practice" },
    ],
  },
  8: {
    cheat: [
      { h: "Open & read", rows: ["with open('f.txt') as f:", "  data = f.read()", "f.readline()  f.readlines()", "modes: 'r' read  'w' write  'a' append", "encoding='utf-8'  # always set it"] },
      { h: "JSON & CSV", rows: ["import json, csv", "obj = json.load(f)", "json.dump(obj, f, indent=2)", "csv.DictReader(f)  # rows as dict"] },
      { h: "Paths (pathlib)", rows: ["from pathlib import Path", "Path('data') / 'in.csv'", "p.exists()  p.read_text()", "p.write_text('hi')"] },
      { h: "Safety", rows: ["except FileNotFoundError:", "except OSError as e:", "  logging.error(e)  # import logging first", "with closes files for you"] },
    ],
    resources: [
      { label: "Input & Output (files, format)", url: "https://docs.python.org/3/tutorial/inputoutput.html", kind: "docs" },
      { label: "json module", url: "https://docs.python.org/3/library/json.html", kind: "docs" },
      { label: "csv module", url: "https://docs.python.org/3/library/csv.html", kind: "docs" },
      { label: "pathlib — object-oriented paths", url: "https://docs.python.org/3/library/pathlib.html", kind: "docs" },
    ],
  },
  9: {
    cheat: [
      { h: "try / except", rows: ["try:", "  x = int(s)", "except ValueError as e:", "  print('bad input', e)", "else: / finally:"] },
      { h: "Raise & custom errors", rows: ["raise ValueError('msg')", "class MyError(Exception): pass", "raise NewError from old_err  # chaining"] },
      { h: "Debug tools", rows: ["breakpoint()  # interactive pdb", "print(f'{x=}')  # debug f-string", "python -m pdb script.py", "assert cond, 'msg'"] },
      { h: "Logging", rows: ["import logging", "logging.basicConfig(level=logging.INFO)", "logging.exception('failed')", "# never bare except:"] },
    ],
    resources: [
      { label: "Errors & Exceptions (official)", url: "https://docs.python.org/3/tutorial/errors.html", kind: "docs" },
      { label: "pdb — the debugger", url: "https://docs.python.org/3/library/pdb.html", kind: "docs" },
      { label: "traceback module", url: "https://docs.python.org/3/library/traceback.html", kind: "docs" },
      { label: "logging module", url: "https://docs.python.org/3/library/logging.html", kind: "docs" },
    ],
  },
  10: {
    cheat: [
      { h: "Create arrays", rows: ["import numpy as np", "np.array([1, 2, 3])", "np.zeros((3, 4))  np.ones(5)", "np.arange(0, 10, 2)", "np.linspace(0, 1, 5)"] },
      { h: "Shape & index", rows: ["a.shape  a.dtype  a.ndim", "a[0]  a[1:, :2]  # slices", "a[a > 3]  # boolean mask", "a.reshape(3, 4)  a.T"] },
      { h: "Math", rows: ["a + b  # element-wise", "np.sum(a, axis=0)", "a.mean()  a.std()", "a @ b  # matrix multiply", "np.where(a > 0, 1, 0)"] },
      { h: "Broadcasting", rows: ["(3, 4) + (4,) → OK", "scalar ops apply to all", "shapes align from the right"] },
    ],
    resources: [
      { label: "NumPy for Absolute Beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", kind: "docs" },
      { label: "NumPy Quickstart", url: "https://numpy.org/doc/stable/user/quickstart.html", kind: "docs" },
      { label: "Broadcasting rules", url: "https://numpy.org/doc/stable/user/basics.broadcasting.html", kind: "docs" },
      { label: "NumPy reference", url: "https://numpy.org/doc/stable/reference/", kind: "docs" },
    ],
  },
  11: {
    cheat: [
      { h: "ML types", rows: ["supervised → labelled data", "  regression  (numbers)", "  classification  (categories)", "unsupervised → clustering, PCA", "reinforcement → reward signal"] },
      { h: "Workflow", rows: ["X = features, y = target", "Xtr, Xte, ytr, yte = split", "model.fit(Xtr, ytr)", "model.predict(Xte)", "score = accuracy / R²"] },
      { h: "sklearn essentials", rows: ["from sklearn.model_selection import train_test_split", "cross_val_score(model, X, y, cv=5)", "LinearRegression  RandomForestClassifier", "make_pipeline(scaler, model)  # scale-safe"] },
      { h: "Overfitting check", rows: ["train high, test low → overfit!", "more data / regularization", "validate on held-out set", "plot learning curves"] },
    ],
    resources: [
      { label: "scikit-learn — Basic tutorial", url: "https://scikit-learn.org/stable/tutorial/basic/tutorial.html", kind: "docs" },
      { label: "scikit-learn — User Guide", url: "https://scikit-learn.org/stable/user_guide.html", kind: "docs" },
      { label: "Google — ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course", kind: "article" },
      { label: "Kaggle Learn — free micro-courses", url: "https://www.kaggle.com/learn", kind: "practice" },
    ],
  },
  12: {
    cheat: [
      { h: "Plan", rows: ["write the problem in 1 sentence", "MVP scope you can finish in a week", "break into daily tasks", "one small commit per day"] },
      { h: "Build", rows: ["venv + requirements.txt first", "clean real data before modelling", "test with real user inputs", "log what the model predicts"] },
      { h: "Present", rows: ["problem → approach → demo → results", "show a real screenshot/output", "state limitations honestly", "list concrete next steps"] },
      { h: "Quality bar", rows: ["README: what, why, how to run", "no dead code, no dummy data", "error states handled", "works on a fresh machine"] },
    ],
    resources: [
      { label: "Python HOWTOs (deep dives)", url: "https://docs.python.org/3/howto/", kind: "docs" },
      { label: "PEP 8 — Style Guide", url: "https://peps.python.org/pep-0008/", kind: "docs" },
      { label: "scikit-learn documentation", url: "https://scikit-learn.org/stable/", kind: "docs" },
      { label: "Kaggle Learn — guided projects", url: "https://www.kaggle.com/learn", kind: "practice" },
    ],
  },
};

/** Official quick-reference links shown in the Resource Library card. */
export const LIBRARY_LINKS: Resource[] = [
  { label: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/", kind: "docs" },
  { label: "Official Python Cheatsheet", url: "https://docs.python.org/3/tutorial/cheatsheet.html", kind: "docs" },
  { label: "PEP 8 Style Guide", url: "https://peps.python.org/pep-0008/", kind: "docs" },
  { label: "Python HOWTOs", url: "https://docs.python.org/3/howto/", kind: "docs" },
  { label: "NumPy for Absolute Beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", kind: "docs" },
  { label: "scikit-learn Tutorials", url: "https://scikit-learn.org/stable/tutorial/basic/tutorial.html", kind: "docs" },
];
