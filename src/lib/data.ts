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
