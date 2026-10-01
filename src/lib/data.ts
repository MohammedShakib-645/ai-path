export type TopicStatus = 'completed' | 'in_progress' | 'not_started';

export interface Topic {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: TopicStatus;
  progress: number; // 0-100
  color: string; // bg tint
  iconColor: string;
}

export const INITIAL_TOPICS: Topic[] = [
  { id: 1, title: 'Python Basics', description: 'Learn about Python syntax, variables, data types, operators and basic input/output.', duration: '2 hours', status: 'completed', progress: 100, color: 'bg-green-50', iconColor: 'text-green-600' },
  { id: 2, title: 'Data Types', description: 'Lists, tuples, sets, dictionaries and their operations.', duration: '2 hours', status: 'in_progress', progress: 60, color: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 3, title: 'Control Flow', description: 'Learn if-else statements, loops and conditional execution.', duration: '1.5 hours', status: 'not_started', progress: 0, color: 'bg-gray-50', iconColor: 'text-gray-500' },
  { id: 4, title: 'Functions', description: 'Understand functions, parameters, return values and function scope.', duration: '2 hours', status: 'not_started', progress: 0, color: 'bg-gray-50', iconColor: 'text-gray-500' },
  { id: 5, title: 'Data Structures', description: 'Learn lists, tuples, sets, dictionaries and their operations.', duration: '2.5 hours', status: 'not_started', progress: 0, color: 'bg-gray-50', iconColor: 'text-gray-500' },
  { id: 6, title: 'Projects', description: 'Build real mini projects to apply everything you learned.', duration: '3 hours', status: 'not_started', progress: 0, color: 'bg-gray-50', iconColor: 'text-gray-500' },
];

export const FULL_PATH_TOPICS = [
  { id: 1, title: 'Python Basics', description: 'Learn about Python syntax, variables, data types, operators and basic input/output.', duration: '2 hours', status: 'completed' as TopicStatus },
  { id: 2, title: 'Control Flow', description: 'Learn if-else statements, loops and conditional execution.', duration: '1.5 hours', status: 'completed' as TopicStatus },
  { id: 3, title: 'Functions', description: 'Understand functions, parameters, return values and function scope.', duration: '2 hours', status: 'completed' as TopicStatus },
  { id: 4, title: 'Data Structures', description: 'Learn lists, tuples, sets, dictionaries and their operations.', duration: '2.5 hours', status: 'in_progress' as TopicStatus },
  { id: 5, title: 'Object Oriented Programming', description: 'Classes, objects, inheritance and encapsulation.', duration: '3 hours', status: 'not_started' as TopicStatus },
  { id: 6, title: 'Machine Learning Basics', description: 'What is ML, types of learning, and real-world applications.', duration: '2 hours', status: 'not_started' as TopicStatus },
];

export interface QuizQ {
  q: string;
  code?: string;
  options: string[];
  answer: number;
  tip: string;
  /** mcq (default) | tf (True/False) | multi (multiple correct) | fill (typed answer) */
  type?: "mcq" | "tf" | "multi" | "fill";
  /** multi: all correct option indexes. fill: accepted answers (case-insensitive). */
  answers?: number[];
  accept?: string[];
  /** scenario-based question: extra context shown above the code */
  scenario?: string;
}

export const PYTHON_QUIZ: QuizQ[] = [
  { q: 'What is the correct way to create a list in Python?', options: ['list = {1, 2, 3}', 'list = [1, 2, 3]', 'list(1, 2, 3)', 'list = (1, 2, 3)'], answer: 1, tip: 'Lists use square brackets [] in Python.' },
  { q: 'Which keyword is used to define a function?', options: ['func', 'def', 'function', 'define'], answer: 1, tip: 'def my_func(): defines a function.' },
  { q: 'What will be the output of the following code?', code: 'x = 10\ny = 3\nprint(x // y)', options: ['3.333', '3', '13', '10'], answer: 1, tip: 'Think about the operation being used. In this case, // is the floor division operator in Python.' },
  { q: 'How do you start a for loop over range(5)?', code: 'for i in _____:', options: ['range{5}', 'range(5)', '(range 5)', '[range 5]'], answer: 1, tip: 'range(n) generates 0..n-1.' },
  { q: 'What does len([1,2,3]) return?', options: ['2', '3', '4', 'error'], answer: 1, tip: 'len() counts elements.' },
];

export const PYTHON_QUIZ_MEDIUM: QuizQ[] = [
  { q: 'What is the output of [x**2 for x in range(4)]?', code: 'print([x**2 for x in range(4)])', options: ['[0, 1, 4, 9]', '[1, 4, 9, 16]', '[0, 1, 2, 3]', 'error'], answer: 0, tip: 'range(4) gives 0..3, each squared: 0,1,4,9. List comprehensions build lists in one line.' },
  { q: 'What does dict.get("a") return if "a" is missing?', options: ['KeyError', 'None', '0', 'False'], answer: 1, tip: '.get() returns None by default instead of raising KeyError — safer than d["a"].' },
  { q: 'What is the time complexity of appending to a Python list?', options: ['O(n)', 'O(1) amortized', 'O(log n)', 'O(n²)'], answer: 1, tip: 'List append is O(1) amortized — occasionally the list resizes, but average cost is constant.' },
  { q: 'Which statement about mutable vs immutable is TRUE?', options: ['tuples can be modified', 'lists are immutable', 'strings are immutable', 'dicts are immutable'], answer: 2, tip: 'Strings (and tuples) are immutable — every "change" creates a new object. Lists and dicts are mutable.' },
  { q: 'What does this print?', code: 'def f(a, b=[]):\n    b.append(a)\n    return b\nprint(f(1))\nprint(f(2))', options: ['[1] then [2]', '[1] then [1, 2]', 'error', '[2] then [1]'], answer: 1, tip: 'Classic pitfall: the default list is created ONCE and shared across calls. Never use mutable defaults.' },
];


// Hard tier — mixed question types (True/False, multi-select, fill-in-the-blank,
// scenario-based). Unlocks at 80% average; every question is real Python/CS content.
export const PYTHON_QUIZ_HARD: QuizQ[] = [
  { q: "Python's GIL allows only one thread to execute Python bytecode at a time.", options: ["True", "False"], answer: 0, type: "tf", tip: "The Global Interpreter Lock serializes CPU-bound threads in CPython — use multiprocessing for CPU parallelism." },
  { q: "Which of these expressions evaluate to True? (select ALL that apply)", code: "bool([])\nbool({})\nbool(0)\nbool('0')", options: ["bool([])", "bool({})", "bool(0)", "bool('0')"], answers: [3], answer: 3, type: "multi", tip: "Empty containers and 0 are falsy; a non-empty string — even \"0\" — is truthy." },
  { q: "What is the time complexity of checking 'key in dict' on average?", options: [], answer: 0, type: "fill", accept: ["o(1)", "constant", "constant time"], tip: "Dicts hash the key to a bucket — average O(1); worst case O(n) on hash collisions." },
  { q: "A teammate ships this in a review. What is the core problem?", scenario: "Production incident: memory spiked to 4 GB while rendering a customer list page.", code: "for c in customers:\n    for u in active():        # runs get_users() 10,000 times\n        render(c, u)\n\ndef get_users():\n    return db.query('SELECT * FROM users').fetchall()\n\ndef active():\n    return [u for u in get_users() if u.active]", options: ["N+1 query pattern — fetch once, filter in SQL", "The list comprehension is too slow", "fetchall() is deprecated", "Nothing — this is fine"], answer: 0, tip: "The query re-runs per customer. Filter WHERE active=1 in SQL (or fetch once) — classic N+1." },
  { q: "What does @functools.lru_cache on a function primarily do?", options: ["Logs every call", "Memoizes results of expensive calls", "Wraps the function in a thread", "Validates argument types"], answer: 1, tip: "lru_cache stores results keyed by args — repeat calls with the same args skip recomputation." },
  { q: "Which are valid ways to create a virtual environment? (select ALL that apply)", options: ["python -m venv .venv", "pip install venv", "virtualenv .venv", "poetry init"], answers: [0, 2], answer: 0, type: "multi", tip: "venv (stdlib) and virtualenv both create environments; pip install venv is wrong; poetry init creates a project, not just an env." },
  { q: "In Git, 'git stash' temporarily saves uncommitted changes.", options: ["True", "False"], answer: 0, type: "tf", tip: "stash shelves your dirty working tree so you can switch contexts, then git stash pop restores it." },
  { q: "What is the output?", code: "import itertools\nprint(list(itertools.islice(itertools.count(1), 3)))", options: ["[0, 1, 2]", "[1, 2, 3]", "[1, 2, 3, 4]", "infinite loop"], answer: 1, tip: "count(1) starts at 1 and is infinite — islice takes the first 3: [1, 2, 3]." },
];
