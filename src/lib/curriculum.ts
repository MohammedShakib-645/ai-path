// ─── AI-PATH Curriculum — the complete AI learning journey (PS 03) ───────────
// Single data backbone: courses (levels) → modules → lessons → topics.
// Courses page, Roadmap, Search, Progress mastery and Recommendations all
// read from here. Adding a new course = adding one object below.
import type { ProgressState } from "./store";

export interface Lesson { id: string; title: string; topics: string[]; mins: number }
export interface Module { id: string; title: string; icon: string; lessons: Lesson[] }
export interface Level {
  id: number; title: string; short: string; subtitle: string;
  icon: string; color: string; grad: string; modules: Module[];
}

let seq = 0;
const L = (title: string, topics: string[], mins = 25): Lesson =>
  ({ id: `lv${Math.floor(seq / 100)}-${(++seq).toString(36)}`, title, topics, mins });
const M = (title: string, icon: string, lessons: Lesson[]): Module => ({ id: `m${title.slice(0, 6).toLowerCase().replace(/\W/g, "")}`, title, icon, lessons });

export const LEVELS: Level[] = [
  {
    id: 1, title: "Programming Foundations", short: "Python", icon: "🐍", color: "text-green-600", grad: "from-green-500 to-emerald-400",
    subtitle: "Python basics to APIs — the language of AI",
    modules: [
      M("Python Core", "🐍", [
        L("Python Basics & Syntax", ["variables", "print", "indentation", "comments"]),
        L("Data Types & Operators", ["int", "float", "str", "bool", "arithmetic & comparison ops"]),
        L("Conditions", ["if / elif / else", "nested conditions", "ternary"]),
        L("Loops", ["for", "while", "break / continue", "range()"]),
        L("Functions", ["def", "parameters", "return", "scope"]),
        L("Strings deep dive", ["slicing", "f-strings", "methods", "formatting"]),
      ]),
      M("Data Structures", "🗂️", [
        L("Lists", ["indexing", "slicing", "append / pop", "list methods"]),
        L("Tuples & Sets", ["immutability", "set ops", "uniqueness"]),
        L("Dictionaries", ["key-value", "get", "items", "nesting"]),
        L("Comprehensions", ["list comps", "dict comps", "filtering"]),
      ]),
      M("Real Python", "🛠️", [
        L("File Handling", ["open / read / write", "with", "CSV & JSON files"]),
        L("Exception Handling", ["try / except", "raise", "custom errors"]),
        L("OOP", ["class", "objects", "inheritance", "self"]),
        L("Modules & Packages", ["import", "pip", "virtual environments"]),
        L("APIs & JSON", ["requests", "REST", "json parsing", "headers"]),
      ]),
      M("Python for AI", "📊", [
        L("NumPy", ["arrays", "vectorization", "shape & dtype", "broadcasting"]),
        L("Pandas", ["Series", "DataFrame", "read_csv", "indexing"]),
        L("Data Cleaning", ["missing values", "dtypes", "duplicates", "apply"]),
        L("Data Manipulation", ["filter", "groupby", "merge", "sort"]),
        L("Matplotlib & Visualization", ["plot", "scatter", "hist", "subplots"]),
      ]),
    ],
  },
  {
    id: 2, title: "Mathematics for AI", short: "Math", icon: "➗", color: "text-blue-600", grad: "from-blue-500 to-cyan-400",
    subtitle: "Linear algebra, probability & calculus — explained simply",
    modules: [
      M("Linear Algebra", "📐", [
        L("Vectors", ["magnitude", "dot product", "unit vectors"]),
        L("Matrices", ["shape", "transpose", "identity"]),
        L("Matrix Operations", ["add / multiply", "inverse", "eigen intuition"]),
      ]),
      M("Probability & Statistics", "🎲", [
        L("Probability Basics", ["outcomes", "independent events", "conditional"]),
        L("Mean, Median, Mode", ["central tendency", "np.mean", "outlier effect"]),
        L("Variance & Standard Deviation", ["spread", "std", "why it matters"]),
        L("Distributions", ["normal", "binomial", "bell curve"]),
        L("Bayes Theorem", ["prior", "posterior", "real examples"]),
      ]),
      M("Calculus for Optimization", "📈", [
        L("Derivatives", ["slope", "rules", "intuition"]),
        L("Gradients & Partial Derivatives", ["multivariable", "gradient vector", "direction of steepest ascent"]),
        L("Optimization", ["minima / maxima", "learning rate", "gradient descent link"]),
      ]),
    ],
  },
  {
    id: 3, title: "Data Science", short: "Data", icon: "🗄️", color: "text-purple-600", grad: "from-purple-500 to-fuchsia-400",
    subtitle: "From raw data to model-ready features",
    modules: [
      M("Data Foundations", "📥", [
        L("Data Collection", ["CSV / APIs / scraping", "sampling", "data quality"]),
        L("Exploratory Data Analysis", ["describe", "distributions", "correlations"]),
        L("Missing Values", ["isnull", "imputation strategies", "when to drop"]),
        L("Outliers", ["IQR method", "z-score", "capping"]),
      ]),
      M("Feature Engineering", "⚙️", [
        L("Encoding", ["one-hot", "label encoding", "category handling"]),
        L("Scaling", ["MinMax", "StandardScaler", "when each"]),
        L("Feature Engineering", ["bins", "interactions", "date features"]),
        L("Train/Test Split", ["holdout", "random_state", "leakage"]),
      ]),
    ],
  },
  {
    id: 4, title: "Machine Learning", short: "ML", icon: "🧠", color: "text-indigo-600", grad: "from-indigo-500 to-blue-400",
    subtitle: "Supervised, unsupervised & evaluation that actually works",
    modules: [
      M("ML Foundations", "🌱", [
        L("Introduction to ML", ["types of learning", "real applications", "ML pipeline"]),
        L("Supervised Learning", ["labels", "regression vs classification"]),
        L("Unsupervised Learning", ["clusters", "no labels", "dimensionality"]),
      ]),
      M("Regression", "📉", [
        L("Linear Regression", ["fit line", "slope & intercept", "mse"]),
        L("Logistic Regression", ["sigmoid", "decision boundary", "probabilities"]),
      ]),
      M("Classification Models", "🏷️", [
        L("Decision Trees", ["splitting", "gini / entropy", "pruning"]),
        L("Random Forest", ["bagging", "feature importance", "robustness"]),
        L("KNN", ["distance", "k choice", "scaling sensitivity"]),
        L("SVM", ["margin", "kernel trick", "support vectors"]),
        L("Naive Bayes", ["bayes rule", "text use-cases", "assumptions"]),
      ]),
      M("Clustering & Reduction", "🎯", [
        L("Clustering basics", ["similarity", "centroid vs density"]),
        L("K-Means", ["k choice", "inertia", "elbow method"]),
        L("PCA", ["variance", "components", "2D projection"]),
      ]),
      M("Training & Tuning", "🔧", [
        L("Model Training", ["fit / predict", "features vs target"]),
        L("Cross Validation", ["k-fold", "generalization"]),
        L("Hyperparameter Tuning", ["grid search", "random search"]),
        L("Overfitting vs Underfitting", ["variance", "regularization", "more data"]),
        L("Bias / Variance Trade-off", ["error sources", "model complexity"]),
      ]),
      M("Evaluation Metrics", "📏", [
        L("Accuracy, Precision, Recall, F1", ["confusion matrix basics", "when accuracy lies"]),
        L("Confusion Matrix", ["TP / FP / TN / FN", "reading the grid"]),
        L("ROC & AUC", ["threshold", "tpr vs fpr"]),
        L("Regression Metrics", ["MAE", "MSE / RMSE", "R²"]),
      ]),
    ],
  },
  {
    id: 5, title: "Deep Learning", short: "DL", icon: "🕸️", color: "text-pink-600", grad: "from-pink-500 to-rose-400",
    subtitle: "Neural networks from perceptron to transformers-ready stacks",
    modules: [
      M("Neural Network Basics", "⚡", [
        L("Neural Networks", ["layers", "neurons", "weights & biases"]),
        L("Perceptron", ["step function", "history", "limits"]),
        L("Activation Functions", ["ReLU", "sigmoid", "softmax", "why non-linearity"]),
      ]),
      M("Training Networks", "🔁", [
        L("Forward Propagation", ["inputs → outputs", "activations"]),
        L("Loss Functions", ["MSE", "cross-entropy", "what to minimize"]),
        L("Backpropagation", ["chain rule", "gradients", "weight updates"]),
        L("Optimizers", ["SGD", "Adam", "learning rate schedules"]),
      ]),
      M("Architectures", "🏛️", [
        L("CNN", ["convolution", "pooling", "feature maps"]),
        L("RNN", ["sequences", "hidden state", "vanishing gradient"]),
        L("LSTM & GRU", ["gates", "memory", "long sequences"]),
        L("Autoencoders", ["bottleneck", "compression", "denoising"]),
        L("Transfer Learning", ["pretrained models", "fine-tune", "freezing"]),
      ]),
      M("Frameworks", "🧰", [
        L("TensorFlow & Keras", ["Sequential", "compile / fit", "layers API"]),
        L("PyTorch", ["tensors", "autograd", "training loop"]),
      ]),
    ],
  },
  {
    id: 6, title: "Natural Language Processing", short: "NLP", icon: "💬", color: "text-amber-600", grad: "from-amber-500 to-orange-400",
    subtitle: "How machines read and understand text",
    modules: [
      M("Text Fundamentals", "🔤", [
        L("NLP Introduction", ["use cases", "NLP pipeline"]),
        L("Tokenization", ["word / sentence tokens", "subword", "BPE intro"]),
        L("Stop Words, Stemming & Lemmatization", ["noise removal", "root forms", "when to use which"]),
      ]),
      M("Text Representation", "🧱", [
        L("Bag of Words", ["counts", "vectors", "limitations"]),
        L("TF-IDF", ["term importance", "sklearn TfidfVectorizer"]),
        L("Word Embeddings", ["dense vectors", "similarity", "Word2Vec"]),
      ]),
      M("NLP Applications", "🚀", [
        L("Sentiment Analysis", ["polarity", "text classification flow"]),
        L("Text Classification", ["pipeline", "naive bayes baseline"]),
        L("Named Entity Recognition", ["entities", "spacy / regex"]),
        L("Sequence Models", ["seq2seq", "attention intro", "transformers link"]),
      ]),
    ],
  },
  {
    id: 7, title: "Computer Vision", short: "CV", icon: "👁️", color: "text-teal-600", grad: "from-teal-500 to-emerald-400",
    subtitle: "Images → pixels → predictions",
    modules: [
      M("Image Basics", "🖼️", [
        L("Image Processing", ["pixels", "grayscale", "resize / crop"]),
        L("OpenCV", ["cv2", "edges", "color spaces"]),
      ]),
      M("Vision Models", "🤖", [
        L("Image Classification", ["CNN features", "softmax over classes"]),
        L("Object Detection", ["bounding boxes", "IoU", "YOLO concepts"]),
        L("Image Segmentation", ["pixel-wise labels", "masks"]),
        L("Transfer Learning for Vision", ["ResNet / VGG", "fine-tuning"]),
      ]),
    ],
  },
  {
    id: 8, title: "Generative AI & LLMs", short: "GenAI", icon: "✨", color: "text-violet-600", grad: "from-violet-500 to-purple-400",
    subtitle: "Transformers, prompts, RAG and modern GenAI systems",
    modules: [
      M("Generative AI Basics", "💫", [
        L("What is Generative AI?", ["generative vs discriminative", "use cases"]),
        L("LLMs", ["pretraining", "scaling", "chat models"]),
        L("Tokens & Context", ["tokenization", "context window", "cost"]),
        L("Embeddings & Vector Databases", ["semantic search", "similarity", "FAISS / pgvector"]),
      ]),
      M("Transformer Era", "🌀", [
        L("Transformers", ["architecture", "encoder / decoder"]),
        L("Attention Mechanism", ["self-attention", "QKV", "why it works"]),
        L("GPT-style Models", ["autoregressive", "next token", "fine-tuning"]),
        L("Multimodal AI", ["vision + text", "image captioning", "VLMs"]),
      ]),
      M("Building with GenAI", "🏗️", [
        L("Prompt Engineering", ["role", "few-shot", "structure"]),
        L("RAG", ["retrieval augmented generation", "chunks", "grounding"]),
        L("Fine-Tuning", ["LoRA", "datasets", "when to fine-tune vs RAG"]),
      ]),
    ],
  },
  {
    id: 9, title: "AI Agents", short: "Agents", icon: "🦾", color: "text-rose-600", grad: "from-rose-500 to-red-400",
    subtitle: "LLMs that plan, call tools and get work done",
    modules: [
      M("Agent Foundations", "🧩", [
        L("AI Agents", ["LLM + tools + loop", "use cases"]),
        L("Agent Architecture", ["perceive → reason → act", "system design"]),
        L("Tools & Function Calling", ["tool schema", "API calls", "tool selection"]),
      ]),
      M("Reasoning & Memory", "🧠", [
        L("Memory", ["short / long term", "context management"]),
        L("Planning & Reasoning", ["decomposition", "chain of thought", "reflection"]),
        L("Multi-Agent Systems", ["roles", "handoffs", "orchestrator pattern"]),
        L("Agent Workflows", ["pipelines", "evaluation", "guardrails"]),
      ]),
    ],
  },
  {
    id: 10, title: "AI Projects", short: "Projects", icon: "🚀", color: "text-orange-600", grad: "from-orange-500 to-amber-400",
    subtitle: "Build a portfolio that proves your skills",
    modules: [
      M("Starter Projects", "🥇", [
        L("Student Performance Predictor", ["regression", "EDA", "sklearn"]),
        L("House Price Predictor", ["features", "linear regression", "metrics"]),
        L("Spam Detector", ["text classification", "TF-IDF", "naive bayes"]),
        L("Sentiment Analyzer", ["NLP pipeline", "embeddings", "evaluation"]),
      ]),
      M("Vision & Language Projects", "🥈", [
        L("Image Classifier", ["CNN", "data augmentation", "transfer learning"]),
        L("Face / Object Detection", ["YOLO concepts", "bounding boxes"]),
        L("Chatbot", ["intent matching", "conversation state"]),
        L("RAG Chatbot", ["vector store", "retrieval", "grounded answers"]),
      ]),
      M("Applied AI Projects", "🥉", [
        L("AI Study Assistant", ["prompt design", "memory", "UX"]),
        L("AI Resume Analyzer", ["parsing", "scoring rubric", "LLM output"]),
        L("AI Recommendation System", ["collaborative filtering", "embeddings"]),
        L("AI Agent", ["tools", "planning", "guardrails"]),
      ]),
    ],
  },
];

// ─── Flatten helpers ──────────────────────────────────────────────────────────
export interface FlatLesson { lesson: Lesson; module: Module; level: Level }
export const ALL_LESSONS: FlatLesson[] = LEVELS.flatMap((level) =>
  level.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, module, level })))
);
export const TOTAL_LESSONS = ALL_LESSONS.length;

export function findLesson(id: string): FlatLesson | undefined {
  return ALL_LESSONS.find((x) => x.lesson.id === id);
}
export function levelDone(s: ProgressState, level: Level): number {
  const set = new Set(s.lessons ?? []);
  return level.modules.reduce((a, m) => a + m.lessons.filter((l) => set.has(l.id)).length, 0);
}
export function levelTotal(level: Level): number {
  return level.modules.reduce((a, m) => a + m.lessons.length, 0);
}
export function coursePct(s: ProgressState, level: Level): number {
  const t = levelTotal(level);
  return t ? Math.round((levelDone(s, level) / t) * 100) : 0;
}
/** First unfinished lesson across the whole curriculum — real "continue learning". */
export function nextLesson(s: ProgressState): FlatLesson {
  const set = new Set(s.lessons ?? []);
  return ALL_LESSONS.find((x) => !set.has(x.lesson.id)) ?? ALL_LESSONS[ALL_LESSONS.length - 1];
}
export function totalDone(s: ProgressState): number {
  return (s.lessons ?? []).length;
}

// ─── Skill mastery per domain (drives Progress bars + dashboard) ──────────────
export const SKILL_DOMAINS: { id: string; label: string; icon: string; levelIds: number[] }[] = [
  { id: "python", label: "Python", icon: "🐍", levelIds: [1] },
  { id: "math", label: "Math for AI", icon: "➗", levelIds: [2] },
  { id: "data", label: "Data Science", icon: "🗄️", levelIds: [3] },
  { id: "ml", label: "Machine Learning", icon: "🧠", levelIds: [4] },
  { id: "dl", label: "Deep Learning", icon: "🕸️", levelIds: [5] },
  { id: "nlp", label: "NLP", icon: "💬", levelIds: [6] },
  { id: "cv", label: "Computer Vision", icon: "👁️", levelIds: [7] },
  { id: "genai", label: "GenAI & LLMs", icon: "✨", levelIds: [8] },
  { id: "agents", label: "AI Agents", icon: "🦾", levelIds: [9] },
  { id: "projects", label: "Projects", icon: "🚀", levelIds: [10] },
];

export function domainPct(s: ProgressState, levelIds: number[]): number {
  const set = new Set(s.lessons ?? []);
  let total = 0, done = 0;
  for (const id of levelIds) {
    const lv = LEVELS.find((l) => l.id === id);
    if (!lv) continue;
    for (const m of lv.modules) for (const l of m.lessons) { total++; if (set.has(l.id)) done++; }
  }
  return total ? Math.round((done / total) * 100) : 0;
}

// ─── Projects (Level 10 portfolio — full spec per PS) ─────────────────────────
export interface Project {
  id: string; title: string; level: "Beginner" | "Intermediate" | "Advanced"; tags: string[];
  problem: string; objective: string; requirements: string[]; concepts: string[];
  steps: { t: string; d: string }[]; code: string; explain: string;
  output: string; challenges: string[]; assessment: string[];
}

export const PROJECTS: Project[] = [
  {
    id: "student-performance", title: "Student Performance Predictor", level: "Beginner", tags: ["Regression", "EDA", "sklearn"],
    problem: "Schools have historical student records but no way to predict who will score poorly before exams.",
    objective: "Build a regression model that predicts a student's score from study hours, attendance and prior grades.",
    requirements: ["Python + pandas + scikit-learn", "Dataset with ≥ 5 features", "Train/test split + evaluation report"],
    concepts: ["Linear Regression", "Train/Test Split", "MAE & R²", "Feature scaling"],
    steps: [
      { t: "Load & inspect data", d: "read_csv, df.head(), df.describe(), check nulls." },
      { t: "Clean & select features", d: "Drop nulls or fill medians; separate X and y." },
      { t: "Split & train", d: "train_test_split(test_size=0.2), fit LinearRegression." },
      { t: "Evaluate", d: "Predict on test, print MAE and R² score." },
      { t: "Interpret", d: "Read model.coef_ — which feature moves the score most?" },
    ],
    code: `import pandas as pd\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.metrics import mean_absolute_error, r2_score\n\ndf = pd.read_csv("students.csv")\nX = df[["study_hours", "attendance", "prev_score"]]\ny = df["score"]\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\nmodel = LinearRegression().fit(X_train, y_train)\npred = model.predict(X_test)\n\nprint("MAE:", mean_absolute_error(y_test, pred))\nprint("R2 :", r2_score(y_test, pred))\nprint("Weights:", dict(zip(X.columns, model.coef_.round(2))))`,
    explain: "The model learns one weight per feature. Positive study_hours weight means more study → higher predicted score. R² close to 1.0 means the features explain most of the variance.",
    output: `MAE: 3.42\nR2 : 0.91\nWeights: {'study_hours': 4.12, 'attendance': 0.35, 'prev_score': 0.61}`,
    challenges: ["Add a new feature (sleep hours) — does R² improve?", "Try RandomForestRegressor and compare MAE."],
    assessment: ["Correctly loads and cleans data", "Uses holdout split (no leakage)", "Reports MAE and R²", "Interprets at least one coefficient"],
  },
  {
    id: "house-price", title: "House Price Predictor", level: "Beginner", tags: ["Regression", "Features", "Metrics"],
    problem: "Buyers and sellers need a quick price estimate from property features (area, rooms, location).",
    objective: "Predict house prices with regression and compare two models honestly on the same test set.",
    requirements: ["pandas + scikit-learn", "At least 6 features", "Comparison table of 2 models"],
    concepts: ["Linear vs Random Forest", "RMSE", "One-hot encoding"],
    steps: [
      { t: "Explore", d: "Distribution of prices, correlation heatmap." },
      { t: "Encode", d: "One-hot encode categorical columns (area_type, city)." },
      { t: "Train two models", d: "LinearRegression and RandomForestRegressor." },
      { t: "Compare", d: "Same test set, print RMSE side by side." },
    ],
    code: `import pandas as pd, numpy as np\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.ensemble import RandomForestRegressor\nfrom sklearn.metrics import mean_squared_error\n\ndf = pd.get_dummies(df, drop_first=True)\nX, y = df.drop("price", axis=1), df["price"]\nXtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)\n\nfor name, m in [("Linear", LinearRegression()), ("Forest", RandomForestRegressor(n_estimators=100, random_state=42))]:\n    m.fit(Xtr, ytr)\n    rmse = np.sqrt(mean_squared_error(yte, m.predict(Xte)))\n    print(f"{name}: RMSE = {rmse:,.0f}")`,
    explain: "RMSE is in the same unit as price (₹), so it's directly interpretable: average miss per prediction. The forest usually wins on tabular data but is slower and can overfit — the honest comparison shows the trade-off.",
    output: `Linear: RMSE = 128,400\nForest: RMSE = 96,200`,
    challenges: ["Log-transform the target and re-check RMSE", "Add cross-validation for a fairer estimate"],
    assessment: ["Handles categoricals correctly", "Evaluates on unseen data", "Chooses metric that fits the problem", "Documents which model wins and why"],
  },
  {
    id: "spam-detector", title: "Spam Detector", level: "Beginner", tags: ["NLP", "Classification", "TF-IDF"],
    problem: "Inboxes are flooded with spam; a filter must flag spam messages in real time.",
    objective: "Classify SMS messages as spam/ham using TF-IDF + Naive Bayes with > 95% accuracy.",
    requirements: ["SMS dataset (e.g. UCI spam)", "sklearn pipeline", "Confusion matrix report"],
    concepts: ["TF-IDF", "MultinomialNB", "Precision vs Recall", "Pipeline"],
    steps: [
      { t: "Prepare labels", d: "Map ham→0, spam→1." },
      { t: "Vectorize", d: "TfidfVectorizer(ngram_range=(1,2)) on message text." },
      { t: "Train", d: "MultinomialNB inside a Pipeline." },
      { t: "Evaluate", d: "classification_report + confusion matrix." },
    ],
    code: `from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.metrics import classification_report\n\npipe = make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), MultinomialNB())\npipe.fit(X_train, y_train)\npred = pipe.predict(X_test)\n\nprint(classification_report(y_test, pred, target_names=["ham", "spam"]))\nprint("Example:", pipe.predict(["Free entry in 2 a weekly competition!"])[0])`,
    explain: "TF-IDF turns text into numbers where rare-but-meaningful words (free, winner) get high weight. Naive Bayes then learns P(spam|words). High precision = few legit mails wrongly blocked.",
    output: `              precision    recall  f1-score   support\n         ham       0.98      0.99      0.98       890\n        spam       0.96      0.91      0.93       140`,
    challenges: ["Handle URLs and numbers before vectorizing", "Compare with LogisticRegression"],
    assessment: ["Clean train/test split", "Uses pipeline (no leakage)", "Reports precision AND recall", "Tests on a custom message"],
  },
  {
    id: "sentiment-analyzer", title: "Sentiment Analyzer", level: "Intermediate", tags: ["NLP", "Embeddings", "Evaluation"],
    problem: "Brands need to know whether customer reviews are positive or negative at scale.",
    objective: "Build a sentiment classifier on product reviews and explain its failure cases.",
    requirements: ["Reviews dataset", "Two vectorizers compared (BoW vs TF-IDF)", "Error analysis section"],
    concepts: ["Text classification", "Cross-validation", "Error analysis"],
    steps: [
      { t: "Clean text", d: "Lowercase, strip punctuation, remove stop words." },
      { t: "Compare vectorizers", d: "CountVectorizer vs TfidfVectorizer under CV." },
      { t: "Pick & train best", d: "5-fold cross-validation, fit on full train." },
      { t: "Analyze errors", d: "Read 5 misclassified reviews — what confused the model?" },
    ],
    code: `from sklearn.model_selection import cross_val_score\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.pipeline import make_pipeline\n\nfor vec in ["bow", "tfidf"]:\n    pipe = make_pipeline(TfidfVectorizer() if vec == "tfidf" else CountVectorizer(), LogisticRegression(max_iter=1000))\n    scores = cross_val_score(pipe, X_text, y, cv=5, scoring="accuracy")\n    print(vec, round(scores.mean(), 3), "±", round(scores.std(), 3))`,
    explain: "Cross-validation gives a stable estimate (mean ± std) instead of one lucky split. Error analysis is where real learning happens: sarcasm, typos and domain words are the usual culprits.",
    output: `bow    0.861 ± 0.014\ntfidf  0.879 ± 0.009`,
    challenges: ["Add n-grams (1,2)", "Handle emojis as sentiment features"],
    assessment: ["Uses cross-validation", "Compares ≥ 2 approaches quantitatively", "Writes honest error analysis", "Deploys as a reusable function"],
  },
  {
    id: "image-classifier", title: "Image Classifier", level: "Intermediate", tags: ["CNN", "Transfer Learning", "Augmentation"],
    problem: "Classify product images into categories without hand-crafted rules.",
    objective: "Train a CNN from scratch, then beat it with transfer learning on the same data.",
    requirements: ["Image dataset (e.g. CIFAR-10 / cats-vs-dogs)", "Keras or PyTorch", "Accuracy curve plot"],
    concepts: ["CNN layers", "Data augmentation", "Transfer learning", "Overfitting detection"],
    steps: [
      { t: "Load & visualize", d: "Show sample images per class." },
      { t: "Augment", d: "flip / rotate / zoom to expand training data." },
      { t: "Baseline CNN", d: "3 conv blocks + dense head; plot accuracy curves." },
      { t: "Transfer learning", d: "Frozen MobileNetV2 + new head; compare curves." },
    ],
    code: `from tensorflow.keras.applications import MobileNetV2\nfrom tensorflow.keras import layers, models\n\nbase = MobileNetV2(weights="imagenet", include_top=False, input_shape=(160, 160, 3))\nbase.trainable = False\n\nmodel = models.Sequential([\n    base,\n    layers.GlobalAveragePooling2D(),\n    layers.Dense(128, activation="relu"),\n    layers.Dropout(0.3),\n    layers.Dense(num_classes, activation="softmax"),\n])\nmodel.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])\nmodel.fit(train_ds, validation_data=val_ds, epochs=10)`,
    explain: "The frozen pretrained base gives strong generic features (edges → textures → parts), so even 10 epochs with few images reaches high accuracy. The head learns YOUR classes.",
    output: `Epoch 10/10 - accuracy: 0.9412 - val_accuracy: 0.9580 (baseline CNN peaked at 0.83)`,
    challenges: ["Unfreeze top 30 layers with a low learning rate", "Plot confusion matrix per class"],
    assessment: ["Prevents data leakage (no augmented val data)", "Compares baseline vs transfer honestly", "Detects overfitting from curves", "Reports per-class accuracy"],
  },
  {
    id: "object-detection", title: "Face / Object Detection", level: "Advanced", tags: ["YOLO", "Bounding Boxes", "OpenCV"],
    problem: "Detect and localize multiple objects in a single frame in real time.",
    objective: "Run a pretrained YOLO model on images/video and draw accurate bounding boxes.",
    requirements: ["OpenCV", "Ultralytics YOLO (pretrained)", "1 video or image demo"],
    concepts: ["Bounding boxes", "IoU", "Confidence threshold", "NMS"],
    steps: [
      { t: "Run inference", d: "model(image) returns boxes, classes, confidences." },
      { t: "Draw boxes", d: "cv2.rectangle + label per detection." },
      { t: "Tune threshold", d: "confidence 0.25 → 0.5: fewer false positives." },
      { t: "Evaluate", d: "Compare with ground truth using IoU > 0.5 rule." },
    ],
    code: `from ultralytics import YOLO\nimport cv2\n\nmodel = YOLO("yolov8n.pt")\nresults = model("street.jpg", conf=0.4)[0]\n\nimg = results.plot()\nfor b in results.boxes:\n    cls = results.names[int(b.cls[0])]\n    conf = float(b.conf[0])\n    print(cls, round(conf, 2))\ncv2.imwrite("detected.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))`,
    explain: "YOLO predicts the whole grid at once (You Only Look Once), so it's fast enough for video. IoU (intersection over union) measures box overlap — > 0.5 counts as a correct detection.",
    output: `person 0.92\ncar 0.88\ntraffic light 0.71\n→ saved detected.jpg`,
    challenges: ["Track objects across video frames", "Run on webcam with FPS counter"],
    assessment: ["Uses confidence thresholding", "Explains IoU", "Runs on video, not just images", "Measures detection speed (FPS)"],
  },
  {
    id: "chatbot", title: "Chatbot", level: "Beginner", tags: ["Intent matching", "Conversation", "NLU"],
    problem: "FAQ pages don't scale; users want instant answers to common questions.",
    objective: "Build an intent-classifying chatbot that answers from a knowledge base with fallback.",
    requirements: ["Intent dataset (JSON)", "TF-IDF or embedding matcher", "Multi-turn conversation log"],
    concepts: ["Intent classification", "Fallback handling", "Conversation state"],
    steps: [
      { t: "Define intents", d: "greeting, hours, pricing, support, fallback." },
      { t: "Train matcher", d: "Similarity between user msg and tagged examples." },
      { t: "Answer from KB", d: "Map intent → template answer." },
      { t: "Add fallback", d: "Low confidence → 'I didn't catch that' + suggestions." },
    ],
    code: `from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.metrics.pairwise import cosine_similarity\nimport json\n\nintents = json.load(open("intents.json"))  # [{tag, patterns, responses}]\npatterns = [p for i in intents for p in i["patterns"]]\ntags = [i["tag"] for i in intents for _ in i["patterns"]]\nvec = TfidfVectorizer().fit_transform(patterns)\n\ndef reply(msg):\n    q = vec.transform([msg])\n    sim = cosine_similarity(q, vec).flatten()\n    i = sim.argmax()\n    if sim[i] < 0.3:\n        return "Sorry, I didn't understand. Try: pricing, hours, support."\n    tag = tags[i]\n    return next(r for r in intents if r["tag"] == tag)["responses"][0]`,
    explain: "Cosine similarity finds the closest known pattern. The confidence threshold (0.3) is what separates a helpful bot from one that hallucinates answers — always ship a fallback.",
    output: `> hi\nHello! How can I help?\n> what does this cost\nPlans start at $9/month.\n> quantum entanglement\nSorry, I didn't understand. Try: pricing, hours, support.`,
    challenges: ["Add follow-up context ('tell me more')", "Store chat history in localStorage"],
    assessment: ["Handles unknown inputs gracefully", "≥ 5 intents with multiple patterns", "Confidence threshold justified", "Conversation log shown"],
  },
  {
    id: "rag-chatbot", title: "RAG Chatbot", level: "Advanced", tags: ["RAG", "Vector DB", "LLM"],
    problem: "LLMs hallucinate facts about private/internal documents they were never trained on.",
    objective: "Build a document Q&A bot that retrieves relevant chunks and answers with citations.",
    requirements: ["Document corpus (PDF/TXT)", "Embeddings + vector store", "LLM with source-grounded prompt"],
    concepts: ["Chunking", "Embeddings", "Retrieval", "Grounding / citations"],
    steps: [
      { t: "Chunk documents", d: "Split into ~500-token pieces with overlap." },
      { t: "Embed & index", d: "Store chunk vectors in FAISS / pgvector." },
      { t: "Retrieve", d: "Embed question → top-k similar chunks." },
      { t: "Generate", d: "LLM answers ONLY from context + returns sources." },
    ],
    code: `from langchain_community.vectorstores import FAISS\nfrom langchain_community.embeddings import HuggingFaceEmbeddings\nfrom langchain.chains import RetrievalQA\nfrom langchain_community.llms import Ollama\n\nemb = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")\ndb = FAISS.from_texts(chunks, emb)\nretriever = db.as_retriever(search_kwargs={"k": 4})\n\nqa = RetrievalQA.from_chain_type(llm=Ollama(model="llama3"), retriever=retriever,\n                                 return_source_documents=True)\nprint(qa.invoke("What is the refund policy?")["result"])`,
    explain: "Retrieval replaces hallucination with evidence: the model sees the actual policy text before answering. k=4 balances coverage vs noise; chunk overlap prevents facts split across boundaries from being lost.",
    output: `Answer: Refunds are issued within 30 days of purchase.\nSources: policy.pdf p.2, faq.pdf #7`,
    challenges: ["Add citation [1] markers inline", "Evaluate retrieval hit-rate on 10 test questions"],
    assessment: ["Sensible chunking strategy", "Shows retrieved sources", "Answers grounded (no invented facts)", "Handles 'not in documents' honestly"],
  },
  {
    id: "study-assistant", title: "AI Study Assistant", level: "Intermediate", tags: ["Prompting", "Memory", "UX"],
    problem: "Students juggle many subjects and need one place for summaries, quizzes and plans.",
    objective: "A tutor bot that summarizes notes, generates quizzes and remembers the learner's level.",
    requirements: ["Chat interface", "System prompt with learner profile", "History-aware context"],
    concepts: ["System prompting", "Context windows", "Personalization"],
    steps: [
      { t: "Build profile", d: "Collect subject, level, weak topics." },
      { t: "System prompt", d: "Role + output rules + profile injection." },
      { t: "Add memory", d: "Send last N messages + stored facts each call." },
      { t: "Modes", d: "summarize / quiz / explain buttons that swap the prompt." },
    ],
    code: `SYSTEM = """You are a study assistant for a {level} learner studying {subject}.\nWeak topics: {weak}.\nRules: short answers, bullet points, one example, end with a question."""\n\ndef ask(history, user_msg, profile):\n    msgs = [{"role": "system", "content": SYSTEM.format(**profile)}]\n    msgs += history[-8:]          # last 8 turns = memory\n    msgs.append({"role": "user", "content": user_msg})\n    return llm(msgs)`,
    explain: "Personalization lives in the system prompt: level, subject and weak topics change every answer. Sending only the last 8 turns keeps memory useful without blowing the context window.",
    output: `> summarize my notes on recursion\n• Recursion = function calling itself with a base case...\nWhich part should I quiz you on?`,
    challenges: ["Persist profile to localStorage", "Add a 'difficulty adapts to quiz scores' rule"],
    assessment: ["Profile visibly changes answers", "Bounded memory", "≥ 3 working modes", "Loading + error states"],
  },
  {
    id: "resume-analyzer", title: "AI Resume Analyzer", level: "Intermediate", tags: ["Parsing", "Scoring", "LLM"],
    problem: "Recruiters screen hundreds of resumes; candidates get no feedback on weak CVs.",
    objective: "Parse a resume + job description, return a match score with concrete improvement tips.",
    requirements: ["PDF/TXT upload or paste", "Scoring rubric (skills, experience, keywords)", "Structured JSON output"],
    concepts: ["Information extraction", "Rubric scoring", "Structured LLM output"],
    steps: [
      { t: "Extract text", d: "PDF → plain text." },
      { t: "Define rubric", d: "skills match 40, experience 30, keywords 20, formatting 10." },
      { t: "LLM scoring", d: "Force JSON: {score, per_section, gaps, fixes}." },
      { t: "Render", d: "Progress bars + prioritized fix list." },
    ],
    code: `PROMPT = """Score this resume for the job.\nRESUME:\\n{resume}\\n\\nJOB:\\n{jd}\\n\nReturn JSON: {\"score\": 0-100, \"sections\": {skills, experience, keywords, format},\n\"gaps\": [..], \"fixes\": [top 5, most impactful first]}"""\n\nimport json\nresult = json.loads(llm(PROMPT.format(resume=text, jd=jd)))\nprint(result["score"], "\\n".join(result["fixes"][:3]))`,
    explain: "Forcing JSON turns free text into UI-ready data. The 'fixes' array is the product: each item is actionable ('add keyword: Kubernetes'), most impactful first.",
    output: `score: 62\n1. Add missing JD keywords: Kubernetes, CI/CD\n2. Quantify impact: 'reduced load time 40%'\n3. Move projects above education`,
    challenges: ["Handle multi-page PDFs", "Compare two resumes side by side"],
    assessment: ["Robust text extraction", "Transparent rubric", "Actionable fixes (not generic)", "Errors handled for bad uploads"],
  },
  {
    id: "recommendation-system", title: "AI Recommendation System", level: "Intermediate", tags: ["Collaborative Filtering", "Embeddings"],
    problem: "Users don't find relevant content in a large catalogue — engagement drops.",
    objective: "Recommend items using user-item similarity and explain why each item was suggested.",
    requirements: ["Ratings or interaction matrix", "Similarity method (cosine / SVD)", "Top-N list per user"],
    concepts: ["Collaborative filtering", "Cold start", "Similarity metrics"],
    steps: [
      { t: "Build matrix", d: "users × items with ratings/interactions." },
      { t: "Similarity", d: "cosine similarity between users." },
      { t: "Rank", d: "Weighted sum of neighbour ratings for unrated items." },
      { t: "Explain", d: "'Because user A liked it' — transparency builds trust." },
    ],
    code: `import numpy as np\nfrom sklearn.metrics.pairwise import cosine_similarity\n\n# rows = users, cols = items\nuser_sim = cosine_similarity(R)\n\ndef recommend(user_idx, n=5):\n    scores = user_sim[user_idx] @ R          # neighbour-weighted scores\n    scores[R[user_idx] > 0] = -1              # hide already-seen items\n    top = np.argsort(scores)[::-1][:n]\n    return [(ITEMS[i], round(scores[i], 2)) for i in top]`,
    explain: "Similar users' preferences are blended into a score for every unseen item. Masking already-seen items prevents pointless recommendations. Cold start (new user) needs a popularity fallback.",
    output: `[('Item_87', 4.31), ('Item_12', 3.95), ('Item_56', 3.72)]`,
    challenges: ["Add item-item similarity as a second strategy", "Handle cold-start with popularity"],
    assessment: ["No seen items recommended", "Similarity justified", "Explains each recommendation", "Cold-start handled"],
  },
  {
    id: "ai-agent", title: "AI Agent", level: "Advanced", tags: ["Tools", "Planning", "Guardrails"],
    problem: "Multi-step tasks (research → compute → summarize) need orchestration beyond one LLM call.",
    objective: "An agent that plans a task, calls tools (search, calculator, file read) and self-checks output.",
    requirements: ["Tool definitions with JSON schemas", "Reasoning loop (plan → act → observe)", "Guardrails + logging"],
    concepts: ["Function calling", "ReAct loop", "Reflection", "Guardrails"],
    steps: [
      { t: "Define tools", d: "search(query), calculator(expr), read_file(path) with schemas." },
      { t: "Reasoning loop", d: "LLM picks tool → run → feed observation back, until done." },
      { t: "Guardrails", d: "Block dangerous paths, cap iterations, validate arguments." },
      { t: "Self-check", d: "Final reflection step verifies answer against the goal." },
    ],
    code: `TOOLS = {\n  "search": lambda q: web_search(q),\n  "calculator": lambda e: str(eval(e, {"__builtins__": {}})),\n}\n\ndef run(goal, max_steps=6):\n    messages = [{"role": "user", "content": goal}]\n    for step in range(max_steps):\n        r = llm(messages, tools=TOOL_SCHEMAS)\n        if r.finish:\n            return self_check(r.answer, goal)\n        obs = TOOLS[r.tool](r.args)              # execute chosen tool\n        messages += [r.raw, {"role": "tool", "content": str(obs)}]\n    return "Max steps reached — refine the goal."`,
    explain: "The loop lets the model chain tools: it can't multiply 17-digit numbers in its head, but it can call the calculator. self_check catches confident-but-wrong answers before returning.",
    output: `Plan: 1) search prices 2) calculate total 3) summarize\n→ calculator('149 * 1.18') = 175.82\nFinal: ₹175.82 incl. tax ✓ (self-check passed)`,
    challenges: ["Add a file-write tool with confirmation", "Visualize the plan as a progress bar"],
    assessment: ["≥ 3 working tools", "Bounded loop with cap", "Guardrails documented", "Self-check step present"],
  },
];

// ─── Achievements — unlock ONLY from real actions ─────────────────────────────
export interface Achievement {
  id: string; title: string; desc: string; icon: string; check: (s: ProgressState) => boolean;
}
export const ACHIEVEMENTS: Achievement[] = [
  { id: "py-beginner", title: "Python Beginner", desc: "Complete 5 Python lessons", icon: "🐍", check: (s) => domainPct(s, [1]) >= 25 },
  { id: "py-master", title: "Python Master", desc: "Complete all Python lessons", icon: "🏆", check: (s) => domainPct(s, [1]) === 100 },
  { id: "ml-explorer", title: "ML Explorer", desc: "Complete your first 3 ML lessons", icon: "🧠", check: (s) => domainPct(s, [4]) >= 15 },
  { id: "ml-practitioner", title: "ML Practitioner", desc: "Reach 60% in Machine Learning", icon: "🤖", check: (s) => domainPct(s, [4]) >= 60 },
  { id: "dl-beginner", title: "Deep Learning Beginner", desc: "Complete 4 Deep Learning lessons", icon: "🕸️", check: (s) => domainPct(s, [5]) >= 25 },
  { id: "nlp-explorer", title: "NLP Explorer", desc: "Complete 4 NLP lessons", icon: "💬", check: (s) => domainPct(s, [6]) >= 25 },
  { id: "genai-explorer", title: "GenAI Explorer", desc: "Complete 4 GenAI lessons", icon: "✨", check: (s) => domainPct(s, [8]) >= 25 },
  { id: "first-project", title: "First Project", desc: "Complete any project lesson", icon: "🥇", check: (s) => domainPct(s, [10]) > 0 },
  { id: "streak-7", title: "7 Day Streak", desc: "Study 7 days in a row", icon: "🔥", check: (s) => (s.streak?.length ?? 0) >= 7 },
  { id: "streak-30", title: "30 Day Streak", desc: "Study 30 days in a row", icon: "⚡", check: (s) => (s.streak?.length ?? 0) >= 30 },
  {
    id: "quiz-master", title: "Quiz Master", desc: "Average 80%+ across quizzes", icon: "🎯",
    check: (s) => s.attempts.length >= 3 && s.attempts.reduce((a, x) => a + x.score / Math.max(1, x.total), 0) / s.attempts.length >= 0.8,
  },
  { id: "ten-lessons", title: "Dedicated Learner", desc: "Complete 10 course lessons", icon: "📚", check: (s) => (s.lessons?.length ?? 0) >= 10 },
];
export function unlockedIds(s: ProgressState): string[] {
  return ACHIEVEMENTS.filter((a) => { try { return a.check(s); } catch { return false; } }).map((a) => a.id);
}

// ─── Interview mode question bank ─────────────────────────────────────────────
export const INTERVIEW_TRACKS: { id: string; label: string; icon: string; qs: { q: string; keys: string[] }[] }[] = [
  {
    id: "python", label: "Python", icon: "🐍", qs: [
      { q: "What is the difference between a list and a tuple in Python?", keys: ["mutable", "immutable", "[] vs ()", "hashable"] },
      { q: "Explain how Python's garbage collector works.", keys: ["reference counting", "cycles", "gc module"] },
      { q: "What are decorators and when would you use one?", keys: ["wraps function", "@syntax", "cross-cutting", "logging/auth"] },
      { q: "Difference between *args and **kwargs?", keys: ["variadic positional", "variadic keyword", "tuple", "dict"] },
      { q: "How does a context manager (with statement) work?", keys: ["__enter__", "__exit__", "resource", "finally"] },
      { q: "What is the GIL and why does it matter?", keys: ["global interpreter lock", "threads", "CPU-bound", "multiprocessing"] },
    ],
  },
  {
    id: "ml", label: "Machine Learning", icon: "🧠", qs: [
      { q: "Explain the bias-variance tradeoff.", keys: ["underfit vs overfit", "complexity", "error decomposition"] },
      { q: "How do you handle an imbalanced dataset?", keys: ["resampling", "class_weight", "SMOTE", "precision/recall", "F1"] },
      { q: "What is cross-validation and why do we use it?", keys: ["k-fold", "generalization", "variance of estimate"] },
      { q: "L1 vs L2 regularization — difference?", keys: ["Lasso", "Ridge", "sparse", "shrinkage"] },
      { q: "When would you use Random Forest over Logistic Regression?", keys: ["non-linear", "interactions", "interpretability", "baseline"] },
      { q: "How do you know a model is overfitting?", keys: ["train vs validation gap", "high variance", "learning curve"] },
    ],
  },
  {
    id: "dl", label: "Deep Learning", icon: "🕸️", qs: [
      { q: "Why are activation functions necessary?", keys: ["non-linearity", "without them = linear", "expressiveness"] },
      { q: "Explain backpropagation in one minute.", keys: ["chain rule", "gradient flow", "weight update"] },
      { q: "Why does ReLU often beat sigmoid?", keys: ["vanishing gradient", "computationally cheap", "sparsity"] },
      { q: "What problem do LSTMs solve over plain RNNs?", keys: ["long-term memory", "vanishing gradient", "gates"] },
      { q: "When do you use Batch Normalization?", keys: ["stabilize", "faster training", "internal covariate shift"] },
      { q: "CNN vs fully-connected network for images?", keys: ["parameter sharing", "locality", "translation invariance"] },
    ],
  },
  {
    id: "nlp", label: "NLP", icon: "💬", qs: [
      { q: "What is TF-IDF and why is it useful?", keys: ["term frequency", "inverse doc freq", "weight rare words"] },
      { q: "How do word embeddings capture meaning?", keys: ["dense vectors", "context/co-occurrence", "similarity"] },
      { q: "Explain the attention mechanism briefly.", keys: ["weights on relevant tokens", "query/key/value", "context"] },
      { q: "Tokenization — word-level vs subword?", keys: ["vocab size", "OOV", "BPE", "rare words"] },
      { q: "How would you detect spam vs ham?", keys: ["TF-IDF", "naive bayes", "precision/recall"] },
    ],
  },
  {
    id: "genai", label: "GenAI / LLMs", icon: "✨", qs: [
      { q: "What is RAG and why use it instead of fine-tuning?", keys: ["retrieval", "up-to-date", "private data", "cheaper"] },
      { q: "Explain tokens and context windows.", keys: ["subword units", "max length", "cost", "truncation"] },
      { q: "How does a transformer's self-attention work?", keys: ["QKV", "parallel", "position of tokens"] },
      { q: "Prompt engineering techniques you use?", keys: ["role", "few-shot", "structured output", "chain of thought"] },
      { q: "How do you reduce LLM hallucination?", keys: ["grounding", "RAG", "citations", "temperature"] },
      { q: "When would you fine-tune instead of using RAG?", keys: ["style/format", "domain", "fixed knowledge", "latency"] },
    ],
  },
  {
    id: "agents", label: "AI Agents", icon: "🦾", qs: [
      { q: "What makes an LLM system an 'agent'?", keys: ["tools", "loop", "autonomy", "goal"] },
      { q: "How does function calling work?", keys: ["JSON schema", "model picks tool", "app executes", "result back"] },
      { q: "How do you prevent an agent from going rogue?", keys: ["max steps", "guardrails", "confirmation", "logging"] },
      { q: "Multi-agent vs single agent — tradeoffs?", keys: ["specialization", "coordination cost", "handoffs"] },
      { q: "How would you evaluate agent quality?", keys: ["task success rate", "traces", "regression tests"] },
    ],
  },
];

// ─── Practice bank — categories × difficulty (real questions + answers) ───────
export interface PracticeQ {
  id: string; cat: string; diff: "Easy" | "Medium" | "Hard";
  q: string; code?: string; options: string[]; answer: number; why: string;
}
export const PRACTICE_CATS = [
  { id: "python", label: "Python", icon: "🐍" },
  { id: "math", label: "Mathematics", icon: "➗" },
  { id: "ds", label: "Data Science", icon: "🗄️" },
  { id: "ml", label: "Machine Learning", icon: "🧠" },
  { id: "dl", label: "Deep Learning", icon: "🕸️" },
  { id: "nlp", label: "NLP", icon: "💬" },
  { id: "cv", label: "Computer Vision", icon: "👁️" },
  { id: "genai", label: "Generative AI", icon: "✨" },
  { id: "agents", label: "AI Agents", icon: "🦾" },
];
export const PRACTICE_BANK: PracticeQ[] = [
  // Python
  { id: "p-e1", cat: "python", diff: "Easy", q: "What is the output?", code: "print(type(3/2))", options: ["<class 'int'>", "<class 'float'>", "<class 'decimal'>", "Error"], answer: 1, why: "Python 3's / always returns float; use // for integer division." },
  { id: "p-m1", cat: "python", diff: "Medium", q: "What does this print?", code: "d = {'a': 1}\nd.update({'b': 2})\nprint(len(d))", options: ["1", "2", "3", "KeyError"], answer: 1, why: "update() merges key-value pairs; dict now has a and b." },
  { id: "p-h1", cat: "python", diff: "Hard", q: "What is the output?", code: "class A:\n    pass\nprint(A.__dict__.get('__module__', '?'))", options: ["'?'", "'__main__'", "'A'", "AttributeError"], answer: 1, why: "__module__ records where the class was defined — '__main__' when run as a script." },
  // Math
  { id: "m-e1", cat: "math", diff: "Easy", q: "What is the dot product of [1,2] and [3,4]?", options: ["11", "14", "10", "[3,8]"], answer: 0, why: "1×3 + 2×4 = 3 + 8 = 11." },
  { id: "m-m1", cat: "math", diff: "Medium", q: "A fair die is rolled twice. Probability of two sixes?", options: ["1/6", "1/12", "1/36", "1/3"], answer: 2, why: "Independent events multiply: 1/6 × 1/6 = 1/36." },
  { id: "m-h1", cat: "math", diff: "Hard", q: "Gradient descent step: θ=1.0, lr=0.1, dL/dθ=4.0. New θ?", options: ["1.4", "0.6", "4.0", "0.4"], answer: 1, why: "θ_new = θ − lr × grad = 1.0 − 0.1×4 = 0.6." },
  // Data Science
  { id: "d-e1", cat: "ds", diff: "Easy", q: "df.dropna() does what?", options: ["Fills missing with 0", "Removes rows with missing values", "Counts nulls", "Replaces null with 'NaN'"], answer: 1, why: "dropna removes rows (or columns with axis=1) containing missing values." },
  { id: "d-m1", cat: "ds", diff: "Medium", q: "Best method for skewed numeric features before scaling?", options: ["Drop the column", "Log / Box-Cox transform", "Add noise", "Duplicate the column"], answer: 1, why: "Log or Box-Cox reduces skew so scaling and models behave better." },
  { id: "d-h1", cat: "ds", diff: "Hard", q: "You fit a scaler on train AND test. What's the problem?", options: ["Nothing", "Data leakage — test stats leak into training", "Slower training", "Overfitting is prevented"], answer: 1, why: "Always fit on train only, then transform test — otherwise information leaks." },
  // ML
  { id: "ml-e1", cat: "ml", diff: "Easy", q: "Which metric matters most for cancer screening (missing cases is dangerous)?", options: ["Accuracy", "Recall", "Specificity", "R²"], answer: 1, why: "High recall = few false negatives — you catch sick patients." },
  { id: "ml-m1", cat: "ml", diff: "Medium", q: "K in KNN being too small usually causes…", options: ["Underfitting", "Overfitting / noise sensitivity", "No effect", "Faster training"], answer: 1, why: "Small k follows noise; large k smooths the decision boundary." },
  { id: "ml-h1", cat: "ml", diff: "Hard", q: "High validation accuracy but low test accuracy indicates…", options: ["Underfitting", "Overfitting to validation via repeated tuning", "Perfect model", "Data leakage only"], answer: 1, why: "Tuning repeatedly on the same validation set overfits it; the test set exposes it." },
  // DL
  { id: "dl-e1", cat: "dl", diff: "Easy", q: "ReLU(x) equals?", options: ["max(0, x)", "1/(1+e⁻ˣ)", "x if x>0 else 1", "eˣ"], answer: 0, why: "ReLU passes positives unchanged and zeroes negatives." },
  { id: "dl-m1", cat: "dl", diff: "Medium", q: "Main purpose of Dropout?", options: ["Speed up training", "Reduce overfitting by random deactivation", "Normalize inputs", "Increase accuracy always"], answer: 1, why: "Randomly dropping units forces redundant representations — a regularizer." },
  { id: "dl-h1", cat: "dl", diff: "Hard", q: "In backpropagation, gradients are computed with…", options: ["Forward substitution", "Chain rule backwards through the graph", "Monte Carlo sampling", "Fourier transform"], answer: 1, why: "Backprop = reverse-mode autodiff applying the chain rule layer by layer." },
  // NLP
  { id: "n-e1", cat: "nlp", diff: "Easy", q: "'The cat sat' tokenized by splitting gives…", options: ["2 tokens", "3 tokens", "1 token", "5 tokens"], answer: 1, why: "Three whitespace tokens: 'The', 'cat', 'sent'." },
  { id: "n-m1", cat: "nlp", diff: "Medium", q: "TF-IDF gives higher weight to…", options: ["Frequent words everywhere", "Words rare across corpus but common here", "Short words", "Stop words"], answer: 1, why: "IDF penalizes common words; TF rewards local frequency." },
  { id: "n-h1", cat: "nlp", diff: "Hard", q: "In self-attention, query·key similarity controls…", options: ["Output length", "How much each token's value is mixed in", "Vocabulary size", "Learning rate"], answer: 1, why: "Softmax(QKᵀ/√d) becomes the weighting over values V." },
  // CV
  { id: "c-e1", cat: "cv", diff: "Easy", q: "A 3×3 kernel slides over an image in a… layer?", options: ["Dense", "Convolution", "Pooling", "Dropout"], answer: 1, why: "Convolution computes local weighted sums to extract features." },
  { id: "c-m1", cat: "cv", diff: "Medium", q: "Max pooling mainly does…", options: ["Adds channels", "Downsamples & keeps strongest signals", "Normalizes colors", "Adds bias"], answer: 1, why: "It reduces spatial size and adds mild translation invariance." },
  { id: "c-h1", cat: "cv", diff: "Hard", q: "IoU of 0.5 between prediction and ground truth at threshold 0.5 counts as…", options: ["Correct detection", "False positive", "Miss", "Ignore"], answer: 0, why: "IoU ≥ threshold counts as a true positive — the standard VOC/COCO rule." },
  // GenAI
  { id: "g-e1", cat: "genai", diff: "Easy", q: "LLM stands for…", options: ["Large Language Model", "Linear Logic Graph", "Low-Level Grammar", "Local Language Module"], answer: 0, why: "Large Language Model — trained on text to predict tokens." },
  { id: "g-m1", cat: "genai", diff: "Medium", q: "In RAG, retrieved chunks are…", options: ["Fine-tuned into weights", "Inserted into the prompt as context", "Deleted after indexing", "Used as labels"], answer: 1, why: "RAG = Retrieval Auged Generation: context goes in the prompt, weights unchanged." },
  { id: "g-h1", cat: "genai", diff: "Hard", q: "Raising temperature from 0.2 to 0.9 in sampling…", options: ["Makes output deterministic", "Increases randomness / diversity", "Shortens responses", "Adds tokens"], answer: 1, why: "Temperature flattens the token distribution → more diverse, less predictable text." },
  // Agents
  { id: "a-e1", cat: "agents", diff: "Easy", q: "An agent's core loop is…", options: ["Think → Act → Observe", "Train → Deploy", "Upload → Download", "Sort → Search"], answer: 0, why: "Plan/reason, call a tool, read the result, repeat until done." },
  { id: "a-m1", cat: "agents", diff: "Medium", q: "Function calling mainly lets the LLM…", options: ["Execute code by itself", "Choose a tool + arguments the app runs", "Train new models", "Bypass the API"], answer: 1, why: "The model only emits a structured call — YOUR app executes it safely." },
  { id: "a-h1", cat: "agents", diff: "Hard", q: "Best guardrail against infinite agent loops?", options: ["Bigger context", "Max-iteration cap + timeout", "Lower temperature", "More tools"], answer: 1, why: "Hard caps guarantee termination even when the model gets stuck." },
];
