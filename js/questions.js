export const TOPICS = [
  "Core", "OOP", "Collections", "Concurrency", "JVM", "Spring", "SQL", "Behavioral"
];

export const QUESTIONS = [
  {
    id: "core-strings-immut",
    topic: "Core",
    type: "open",
    q: "Why is String immutable in Java? What are the pros and cons of this decision?",
    a: [
      "Security: string interning and caching in the pool; safe to use as Map keys.",
      "Thread safety: immutability simplifies shared access.",
      "hashCode caching: speeds up collection operations.",
      "Compromise: creation of new objects on concatenation (StringBuilder for loops)."
    ]
  },
  {
    id: "oop-solid",
    topic: "OOP",
    type: "open",
    q: "Explain SOLID principles and give a short example of LSP violation.",
    a: [
      "S: Single Responsibility — one reason to change.",
      "O: Open/Closed — extend without modification.",
      "L: Liskov Substitution — subtypes can replace base types without surprises (Rectangle/Square is a classic anti-pattern).",
      "I: Interface Segregation — narrow interfaces.",
      "D: Dependency Inversion — depend on abstractions, not details."
    ]
  },
  {
    id: "coll-hashmap",
    topic: "Collections",
    type: "mcq",
    q: "What happens during collisions in HashMap in Java 8+ with a large number of elements in one bucket?",
    options: [
      "HashMap throws ConcurrentModificationException",
      "A bucket always stores a linked list",
      "The linked list will be converted to a balanced tree",
      "Elements will be deleted"
    ],
    answer: 2,
    explain: "Since Java 8, long bucket lists (above a certain threshold) are converted to red-black trees for better asymptotic performance."
  },
  {
    id: "concurrency-volatile",
    topic: "Concurrency",
    type: "mcq",
    q: "What does the volatile keyword guarantee?",
    options: [
      "Atomicity of increment",
      "Visibility of changes between threads and prevention of reordering for this variable",
      "Locking access to the variable",
      "Guarantees that the variable will not be null"
    ],
    answer: 1,
    explain: "volatile ensures visibility and partial ordering, but does not make compound operations atomic."
  },
  {
    id: "jvm-gc",
    topic: "JVM",
    type: "open",
    q: "Describe heap generations and how this affects GC operation in HotSpot.",
    a: [
      "Young (Eden + Survivor) — most objects die young, minor GC is fast.",
      "Old/Tenured — for survivors; full/major GC is less frequent, more expensive.",
      "Generational hypothesis optimizes garbage collection for typical object lifetime distribution."
    ]
  },
  {
    id: "spring-bean-scope",
    topic: "Spring",
    type: "mcq",
    q: "What is the default bean scope in Spring?",
    options: ["prototype", "singleton", "request", "session"],
    answer: 1,
    explain: "By default, beans are singletons within the context."
  },
  {
    id: "sql-iso",
    topic: "SQL",
    type: "open",
    q: "Name SQL transaction isolation levels and provide typical artifacts for each.",
    a: [
      "Read Uncommitted — dirty reads",
      "Read Committed — non-repeatable reads",
      "Repeatable Read — phantoms (DBMS dependent)",
      "Serializable — prevents phantoms at the cost of reduced concurrency"
    ]
  },
  {
    id: "beh-star",
    topic: "Behavioral",
    type: "open",
    q: "Tell me about a complex problem from your experience and how you solved it (STAR structure).",
    a: [
      "S: Context and constraints.",
      "T: Your task and success criteria.",
      "A: Specific actions, alternatives, compromises.",
      "R: Measurable results and retrospective."
    ]
  }
];

// You can extend with more questions by pushing into QUESTIONS.