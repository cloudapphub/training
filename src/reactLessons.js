export const reactLessons = [
  {
    time: "Hour 1",
    title: "React 19 Fundamentals — JSX, Components & Props",
    concept: [
      "**React** is a JavaScript library for building user interfaces using a component-based architecture. In React 19 (the current stable release), components are functions that return JSX — a syntax extension that looks like HTML but compiles to JavaScript. Every piece of UI is a component: buttons, forms, entire pages.",
      "**JSX is not HTML.** It looks similar but has key differences: (1) All tags must be closed (`<br />`, not `<br>`). (2) Use `className` instead of `class`. (3) Use `htmlFor` instead of `for`. (4) JavaScript expressions go in curly braces: `{user.name}`. (5) Inline styles are objects: `style={{ color: 'red' }}`. JSX compiles to `React.createElement()` calls.",
      "**Components are functions** that accept `props` (an object of inputs) and return JSX. Props flow ONE direction: parent → child. A component can't modify its own props — they're read-only. This unidirectional data flow makes React apps predictable and easier to debug.",
      "**React 19 removed the need for `forwardRef`.** You can now pass `ref` as a regular prop to function components. Before: `const Input = forwardRef((props, ref) => ...)`. Now: `function Input({ placeholder, ref }) { return <input ref={ref} placeholder={placeholder} />; }` — much cleaner.",
      "**Children** are a special prop. Anything nested between opening and closing tags is passed as `props.children`. This enables composition — wrapping components around other components: `<Card><h2>Title</h2></Card>` where Card receives the `<h2>` as `children`.",
      "**Key rules:** (1) Component names must start with a capital letter (`UserCard`, not `userCard`). (2) Return a single root element (use `<>...</>` Fragment if needed). (3) Every item in a list needs a unique `key` prop. (4) Never mutate props or state directly — always create new values.",
    ],
    code: `// === React 19 Component Fundamentals ===

// 1. Basic Component with Props
function Welcome({ name, role = "learner" }) {
  return (
    <div className="welcome-card">
      <h1>Hello, {name}!</h1>
      <p>Your role: {role}</p>
    </div>
  );
}

// Usage: <Welcome name="Alice" role="admin" />

// 2. Composition with Children
function Card({ title, children, variant = "default" }) {
  return (
    <div className={\`card card--\${variant}\`}>
      {title && <h2 className="card__title">{title}</h2>}
      <div className="card__body">{children}</div>
    </div>
  );
}

// Usage:
// <Card title="User Profile" variant="elevated">
//   <p>Name: Alice</p>
//   <p>Email: alice@example.com</p>
// </Card>

// 3. Conditional Rendering
function StatusBadge({ status }) {
  return (
    <span className={\`badge badge--\${status}\`}>
      {status === "active" ? "✅ Active" :
       status === "pending" ? "⏳ Pending" :
       "❌ Inactive"}
    </span>
  );
}

// 4. List Rendering with Keys
function UserList({ users }) {
  if (users.length === 0) return <p>No users found.</p>;
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} — {user.email}
        </li>
      ))}
    </ul>
  );
}

// 5. React 19: ref as a regular prop (no forwardRef needed!)
function TextInput({ label, placeholder, ref }) {
  return (
    <label>
      {label}
      <input ref={ref} placeholder={placeholder} />
    </label>
  );
}
// Parent: const inputRef = useRef(null);
//         <TextInput ref={inputRef} label="Name" />`,
    practice: "Create a ProductCard component that accepts name, price, imageUrl, inStock (boolean), and rating (number). Render a styled card with conditional 'Out of Stock' badge, star rating display, and a 'Add to Cart' button that's disabled when out of stock.",
    solution: `function ProductCard({ name, price, imageUrl, inStock, rating }) {
  return (
    <div className="product-card">
      <div className="product-card__image-wrapper">
        <img src={imageUrl} alt={name} className="product-card__image" />
        {!inStock && (
          <span className="product-card__badge">Out of Stock</span>
        )}
      </div>
      <div className="product-card__details">
        <h3>{name}</h3>
        <div className="product-card__rating">
          {"★".repeat(Math.round(rating))}
          {"☆".repeat(5 - Math.round(rating))}
          <span>({rating.toFixed(1)})</span>
        </div>
        <p className="product-card__price">
          {"$"}{price.toFixed(2)}
        </p>
        <button disabled={!inStock} className="product-card__btn">
          {inStock ? "Add to Cart" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    time: "Hour 2",
    title: "State & Events — useState, useReducer & Event Handling",
    concept: [
      "**State** is data that changes over time and triggers re-renders when updated. Unlike props (which come from parent), state is owned and managed by the component itself. Use `useState` for simple state (booleans, strings, numbers, objects) and `useReducer` for complex state with multiple related values or intricate update logic.",
      "**useState** returns a pair: `[currentValue, setterFunction]`. Calling the setter triggers a re-render with the new value. CRITICAL: state updates are ASYNCHRONOUS and BATCHED in React 19. If you call `setCount(count + 1)` three times, you get count + 1, not count + 3. Use the functional form: `setCount(prev => prev + 1)` to chain updates correctly.",
      "**useReducer** is `useState`'s powerful sibling. It follows the Redux pattern: `const [state, dispatch] = useReducer(reducer, initialState)`. The reducer is a pure function: `(state, action) => newState`. Dispatch an action object: `dispatch({ type: 'ADD_ITEM', payload: item })`. Use useReducer when state transitions depend on previous state or when multiple state values are closely related.",
      "**Event handling** in React uses camelCase: `onClick`, `onChange`, `onSubmit`. Event handlers receive a synthetic event (cross-browser wrapper). For forms, prevent default submission: `onSubmit={(e) => { e.preventDefault(); ... }}`. For inputs, use controlled components: the input value is driven by state, and `onChange` updates state.",
      "**Immutable updates** are essential. Never mutate state directly. Wrong: `state.items.push(newItem)`. Right: `setState(prev => ({ ...prev, items: [...prev.items, newItem] }))`. For arrays: use spread, `filter`, `map`. For objects: use spread. React uses reference comparison to detect changes — if you mutate an object, React thinks nothing changed.",
      "**Lifting state up:** When two sibling components need to share state, move the state to their closest common parent. The parent owns the state and passes it down as props, plus a setter function so children can update it. This is React's core coordination pattern.",
    ],
    code: `import { useState, useReducer } from "react";

// === useState Examples ===

// 1. Simple counter
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(prev => prev + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// 2. Controlled form input
function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Fetch results...
    console.log("Searching for:", query);
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button type="submit" disabled={!query.trim()}>Search</button>
    </form>
  );
}

// 3. Object state (immutable updates)
function ProfileEditor() {
  const [profile, setProfile] = useState({
    name: "", email: "", bio: ""
  });

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <input value={profile.name}
        onChange={e => updateField("name", e.target.value)}
        placeholder="Name" />
      <input value={profile.email}
        onChange={e => updateField("email", e.target.value)}
        placeholder="Email" />
    </div>
  );
}

// === useReducer for Complex State ===
const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM":
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return { ...state, items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, qty: i.qty + 1 }
            : i
        )};
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
};

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] });
  const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div>
      <h2>Cart ({cart.items.length} items)</h2>
      {cart.items.map(item => (
        <div key={item.id}>
          {item.name} x{item.qty} — {"$"}{(item.price * item.qty).toFixed(2)}
          <button onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}>
            Remove
          </button>
        </div>
      ))}
      <p>Total: {"$"}{total.toFixed(2)}</p>
      <button onClick={() => dispatch({ type: "CLEAR" })}>Clear Cart</button>
    </div>
  );
}`,
    practice: "Build a TodoList component using useReducer. Support: ADD_TODO, TOGGLE_TODO, DELETE_TODO, and FILTER (all/active/completed). Each todo has id, text, and completed fields.",
    solution: `import { useReducer, useState } from "react";

const todoReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TODO":
      return [...state, { id: Date.now(), text: action.payload, completed: false }];
    case "TOGGLE_TODO":
      return state.map(t => t.id === action.payload
        ? { ...t, completed: !t.completed } : t);
    case "DELETE_TODO":
      return state.filter(t => t.id !== action.payload);
    default: return state;
  }
};

function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, []);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = todos.filter(t =>
    filter === "all" ? true :
    filter === "active" ? !t.completed :
    t.completed
  );

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: "ADD_TODO", payload: input.trim() });
    setInput("");
  };

  return (
    <div>
      <form onSubmit={addTodo}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <div>
        {["all", "active", "completed"].map(f =>
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? "bold" : "normal" }}>{f}</button>
        )}
      </div>
      <ul>
        {filtered.map(t => (
          <li key={t.id}>
            <span onClick={() => dispatch({ type: "TOGGLE_TODO", payload: t.id })}
              style={{ textDecoration: t.completed ? "line-through" : "none", cursor: "pointer" }}>
              {t.text}
            </span>
            <button onClick={() => dispatch({ type: "DELETE_TODO", payload: t.id })}>x</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
  },
  {
    time: "Hour 3",
    title: "Side Effects — useEffect, Refs & Lifecycle",
    concept: [
      "**useEffect** synchronizes your component with external systems: APIs, timers, subscriptions, DOM manipulation, localStorage. It runs AFTER the render is committed to the screen. Think of it as 'do this thing outside of React's rendering cycle.' Every effect should have a single, clear purpose.",
      "**The dependency array** controls when the effect runs: `useEffect(fn, [a, b])` runs when `a` or `b` changes. `useEffect(fn, [])` runs once on mount. `useEffect(fn)` (no array) runs after EVERY render — almost always a bug. React 19 uses `Object.is` to compare dependencies. Use the ESLint exhaustive-deps rule to catch missing dependencies.",
      "**Cleanup functions** prevent memory leaks. Return a function from useEffect and React calls it before the next effect runs and when the component unmounts. Essential for: unsubscribing from events, clearing timers, aborting fetch requests. Pattern: `useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, []);`",
      "**useRef** creates a mutable container that persists across renders WITHOUT causing re-renders. Two common uses: (1) Accessing DOM elements: `const inputRef = useRef(null); <input ref={inputRef} />; inputRef.current.focus()`. (2) Storing mutable values that shouldn't trigger re-renders: previous values, timer IDs, instance variables.",
      "**React 19 ref cleanup:** Callback refs can now return a cleanup function. Before: pass `null` on unmount. Now: `<div ref={(node) => { node.style.opacity = 1; return () => { node.style.opacity = 0; }; }} />`. The cleanup runs when the element is removed from the DOM.",
      "**Common useEffect patterns:** (1) Data fetching with AbortController. (2) Event listeners (window resize, scroll). (3) localStorage sync. (4) WebSocket connections. (5) Third-party library initialization. **Anti-patterns to avoid:** Setting state that could be derived from props. Using useEffect to transform data (compute during render instead). Chains of effects that update each other.",
    ],
    code: `import { useState, useEffect, useRef } from "react";

// 1. Data Fetching with Cleanup (AbortController)
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort(); // Cleanup: cancel fetch on unmount
  }, [userId]); // Re-fetch when userId changes

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <div><h2>{user.name}</h2><p>{user.email}</p></div>;
}

// 2. Window Event Listener with Cleanup
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array: setup once, cleanup on unmount

  return <p>Window: {size.width} x {size.height}</p>;
}

// 3. localStorage Sync
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
// Usage: const [theme, setTheme] = useLocalStorage("theme", "dark");

// 4. useRef for DOM Access & Mutable Values
function AutoFocusInput() {
  const inputRef = useRef(null);
  const renderCount = useRef(0);

  useEffect(() => {
    inputRef.current.focus(); // Focus on mount
  }, []);

  renderCount.current += 1; // Doesn't cause re-render

  return (
    <div>
      <input ref={inputRef} placeholder="Auto-focused!" />
      <p>Render count: {renderCount.current}</p>
    </div>
  );
}

// 5. Debounced Search (useEffect + useRef for timer)
function DebouncedSearch({ onSearch }) {
  const [query, setQuery] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (query.trim()) onSearch(query);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query, onSearch]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`,
    practice: "Create a custom hook useDebounce(value, delay) that returns a debounced version of the value. Then use it in a search component that fetches results only after the user stops typing for 500ms.",
    solution: `import { useState, useEffect } from "react";

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SearchWithDebounce() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    const controller = new AbortController();
    setLoading(true);

    fetch(\`/api/search?q=\${encodeURIComponent(debouncedQuery)}\`,
          { signal: controller.signal })
      .then(res => res.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(err => {
        if (err.name !== "AbortError") setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)}
             placeholder="Search..." />
      {loading && <p>Searching...</p>}
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </div>
  );
}`,
  },
  {
    time: "Hour 4",
    title: "Context, Custom Hooks & Composition Patterns",
    concept: [
      "**useContext** solves prop drilling — passing data through many intermediate components that don't use it. Create a context with `createContext()`, provide it with `<Context.Provider value={...}>`, and consume it anywhere below with `useContext(Context)`. Common use cases: theme, authentication, locale, shopping cart.",
      "**React 19's `use` API** can replace `useContext` in some cases. Unlike `useContext`, the `use()` API can be called inside conditionals and loops: `if (showUser) { const user = use(UserContext); }`. This is more flexible but follows different rules — it's a general-purpose resource reader, not just a hook.",
      "**Custom hooks** extract reusable stateful logic into functions that start with `use`. They can use any hooks internally (useState, useEffect, useContext, etc.) and return whatever you want. Examples: `useAuth()` returns `{ user, login, logout }`. `useFetch(url)` returns `{ data, loading, error }`. Custom hooks are the primary mechanism for code reuse in React.",
      "**Composition over inheritance.** React strongly favors composition patterns: (1) **Containment** — components that don't know their children in advance use `children` prop. (2) **Specialization** — generic components configured via props to create specific variants. (3) **Render props** — pass a function as a prop that returns JSX. (4) **Higher-order components (HOCs)** — functions that wrap components to add behavior.",
      "**Context performance tip:** When a context value changes, ALL consumers re-render. To optimize: (1) Split contexts (separate `ThemeContext` from `UserContext`). (2) Memoize the provider value: `const value = useMemo(() => ({ user, login }), [user])`. (3) Use `React.memo()` on consumers. (4) Colocate state — don't put everything in context.",
      "**The Module Pattern:** For global state that doesn't need React context, use module-level singletons with `useSyncExternalStore`. This is how libraries like Zustand and Jotai work. It avoids context provider nesting while maintaining React's reactivity contract.",
    ],
    code: `import { createContext, useContext, useState, useMemo } from "react";

// === Context: Theme Provider ===
const ThemeContext = createContext("light");

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark"),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() { return useContext(ThemeContext); }

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}
      style={{ background: theme === "dark" ? "#333" : "#fff",
               color: theme === "dark" ? "#fff" : "#333" }}>
      Current: {theme}
    </button>
  );
}

// === Custom Hook: useFetch ===
function useFetch(url) {
  const [state, setState] = useState({
    data: null, loading: true, error: null
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => {
        if (err.name !== "AbortError")
          setState({ data: null, loading: false, error: err.message });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

// Usage:
function UsersList() {
  const { data: users, loading, error } = useFetch("/api/users");
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// === Custom Hook: useAuth ===
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}`,
    practice: "Create a NotificationContext that provides: notifications array, addNotification(message, type), and dismissNotification(id). Build a NotificationBar component that renders floating notifications with auto-dismiss after 5 seconds.",
    solution: `import { createContext, useContext, useReducer, useEffect, useCallback } from "react";

const NotificationContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      return [...state, {
        id: Date.now(), message: action.message,
        type: action.notifType || "info"
      }];
    case "DISMISS":
      return state.filter(n => n.id !== action.id);
    default: return state;
  }
};

function NotificationProvider({ children }) {
  const [notifications, dispatch] = useReducer(reducer, []);
  const add = useCallback((message, type) =>
    dispatch({ type: "ADD", message, notifType: type }), []);
  const dismiss = useCallback((id) =>
    dispatch({ type: "DISMISS", id }), []);
  return (
    <NotificationContext.Provider value={{ notifications, add, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

function useNotifications() { return useContext(NotificationContext); }

function NotificationBar() {
  const { notifications, dismiss } = useNotifications();
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999 }}>
      {notifications.map(n => (
        <AutoDismiss key={n.id} id={n.id} dismiss={dismiss}>
          <div className={\`notification notification--\${n.type}\`}>
            {n.message}
            <button onClick={() => dismiss(n.id)}>x</button>
          </div>
        </AutoDismiss>
      ))}
    </div>
  );
}

function AutoDismiss({ id, dismiss, children }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return children;
}`,
  },
  {
    time: "Hour 5",
    title: "React 19 New APIs — Actions, useOptimistic, useActionState & use",
    concept: [
      "**Actions** are React 19's convention for handling async data mutations. Instead of manually tracking loading/error states with useEffect, you pass an async function directly to a form's `action` prop. React automatically manages the pending state, error handling, and optimistic updates. This is the biggest API addition in React 19.",
      "**useActionState** (formerly useFormState) simplifies form handling. It takes an action function and initial state, returning `[state, formAction, isPending]`. The action receives the previous state and the FormData object. Replaces the common pattern of: useState for error/success + useEffect for submission + manual loading state.",
      "**useFormStatus** provides the submission status of a parent `<form>`. It returns `{ pending, data, method, action }`. CRITICAL: it must be called from a component that is a CHILD of the form — it doesn't work if called in the same component that renders the form. Use it for submit buttons that show loading state.",
      "**useOptimistic** enables instant UI updates while an async action is in progress. Pattern: `const [optimisticItems, addOptimistic] = useOptimistic(items, (current, newItem) => [...current, newItem])`. Call `addOptimistic(newItem)` to immediately show the item. If the server request fails, React automatically reverts to the real state.",
      "**The `use` API** is a versatile resource reader that works with Promises and Context. Unlike hooks, `use()` can be called inside conditionals and loops. With Promises: it integrates with Suspense, suspending the component until the Promise resolves. With Context: it replaces `useContext()` with more flexibility. `use()` is NOT a hook — it doesn't follow hook rules about placement.",
      "**Server Actions** (in Next.js/frameworks with RSC support) let you define server-side functions that can be called directly from client components. Mark a function with `'use server'` and pass it to a form's `action` prop. The function runs on the server, has access to databases and secrets, and the result is sent back to the client. This eliminates the need for API route handlers for simple mutations.",
    ],
    code: `import { useActionState, useOptimistic, useFormStatus, use, Suspense } from "react";

// === 1. useActionState: Form with Server Mutation ===
async function submitComment(prevState, formData) {
  const text = formData.get("comment");
  if (!text?.trim()) return { error: "Comment cannot be empty" };

  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) return { error: "Failed to post comment" };
  const comment = await res.json();
  return { success: true, comment };
}

function CommentForm() {
  const [state, formAction, isPending] = useActionState(submitComment, {});
  return (
    <form action={formAction}>
      <textarea name="comment" placeholder="Write a comment..."
        disabled={isPending} />
      <SubmitButton />
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Comment posted!</p>}
    </form>
  );
}

// Must be a CHILD of the <form> to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Posting..." : "Post Comment"}
    </button>
  );
}

// === 2. useOptimistic: Instant Like Feedback ===
function LikeButton({ postId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (current, increment) => current + increment
  );

  const likePost = async () => {
    addOptimistic(1); // Show +1 immediately
    const res = await fetch(\`/api/posts/\${postId}/like\`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes); // Update with real count
    }
    // If request fails, React reverts optimistic update automatically
  };

  return (
    <button onClick={likePost}>
      ❤️ {optimisticLikes}
    </button>
  );
}

// === 3. use() API: Reading Promises with Suspense ===
async function fetchUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}

function UserCard({ userPromise }) {
  const user = use(userPromise); // Suspends until resolved
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState(1);
  const userPromise = fetchUser(userId);
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <UserCard userPromise={userPromise} />
    </Suspense>
  );
}`,
    practice: "Build a TodoForm using useActionState and useOptimistic. When the user submits a new todo, it should appear immediately in the list (optimistic), show a loading state in the submit button (useFormStatus), and revert if the server returns an error.",
    solution: `import { useState, useActionState, useOptimistic, useFormStatus } from "react";

async function addTodoAction(prevState, formData) {
  const text = formData.get("todo");
  if (!text?.trim()) return { ...prevState, error: "Todo is required" };
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return { ...prevState, error: "Failed to add todo" };
  const newTodo = await res.json();
  return { todos: [...prevState.todos, newTodo], error: null };
}

function TodoApp() {
  const [state, formAction, isPending] = useActionState(addTodoAction, {
    todos: [], error: null
  });
  const [optimisticTodos, addOptimistic] = useOptimistic(
    state.todos,
    (current, newTodo) => [...current, { ...newTodo, pending: true }]
  );

  const handleAction = async (formData) => {
    const text = formData.get("todo");
    addOptimistic({ id: Date.now(), text, completed: false });
    await formAction(formData);
  };

  return (
    <div>
      <form action={handleAction}>
        <input name="todo" placeholder="Add todo..." />
        <TodoSubmitButton />
      </form>
      {state.error && <p className="error">{state.error}</p>}
      <ul>
        {optimisticTodos.map(t => (
          <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>
            {t.text} {t.pending && "(saving...)"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodoSubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Adding..." : "Add"}</button>;
}`,
  },
  {
    time: "Hour 6",
    title: "React Router, Navigation & Code Splitting",
    concept: [
      "**React Router v7** (the standard routing library) enables client-side navigation — changing what the user sees without a full page reload. Install: `npm install react-router-dom`. Core components: `<BrowserRouter>` wraps your app, `<Routes>` defines your route map, `<Route path='/users' element={<Users />} />` maps URLs to components, and `<Link to='/users'>` navigates without page reload.",
      "**Dynamic routes** use URL parameters: `<Route path='/users/:id' element={<UserDetail />} />`. Inside the component, read the parameter with `const { id } = useParams()`. This is how you build detail pages, profiles, and any URL-driven content. Nested routes define layouts: a parent route renders shared UI (header, sidebar) and an `<Outlet />` for child routes.",
      "**Programmatic navigation** uses the `useNavigate` hook: `const navigate = useNavigate(); navigate('/dashboard');`. Navigate after a form submission, authentication, or any imperative action. Use `navigate(-1)` to go back. Use `navigate('/login', { replace: true })` to replace history (so the back button skips the redirect).",
      "**Protected routes** guard pages that require authentication. Pattern: create a `<ProtectedRoute>` wrapper that checks auth status and redirects to login if not authenticated. Use `useLocation()` to save the attempted URL and redirect back after login: `<Navigate to='/login' state={{ from: location }} replace />`.",
      "**Code splitting with React.lazy** loads route components on demand, reducing the initial bundle size. Pattern: `const Dashboard = lazy(() => import('./pages/Dashboard'))`. Wrap lazy routes in `<Suspense fallback={<Loading />}>`. Each route becomes a separate JavaScript chunk that downloads only when the user navigates to it.",
      "**Data loading patterns:** React Router v7 supports `loader` functions that fetch data before rendering a route. The data is available via `useLoaderData()`. For more complex apps, **TanStack Query** (React Query) provides caching, background refetching, pagination, and stale-while-revalidate — it's the industry standard for server state management.",
    ],
    code: `import { BrowserRouter, Routes, Route, Link, NavLink,
         useParams, useNavigate, useLocation, Navigate, Outlet }
  from "react-router-dom";
import { lazy, Suspense, useContext, createContext } from "react";

// === Basic Routing Setup ===
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserDetail = lazy(() => import("./pages/UserDetail"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// === Layout with Nested Routes ===
function Layout() {
  return (
    <div>
      <nav>
        <NavLink to="/" className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  );
}

// === Dynamic Route with useParams ===
function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Fetch user by id...
  return (
    <div>
      <h2>User #{id}</h2>
      <button onClick={() => navigate(-1)}>← Back</button>
      <button onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </button>
    </div>
  );
}

// === Protected Route ===
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// After login, redirect back:
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async () => {
    await loginUser();
    navigate(from, { replace: true }); // Go to original page
  };
  return <button onClick={handleLogin}>Login</button>;
}`,
    practice: "Build a multi-page app with: Home, Products (list), ProductDetail (by :id), Cart, and a 404 page. Implement NavLink with active styling, protected Cart route, and programmatic navigation from ProductDetail to Cart after adding an item.",
    solution: `import { BrowserRouter, Routes, Route, NavLink, Link,
         useParams, useNavigate, Navigate, Outlet } from "react-router-dom";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={
            <ProtectedRoute><Cart /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout() {
  return (
    <div>
      <nav style={{ display: "flex", gap: 16 }}>
        {["/", "/products", "/cart"].map(path => (
          <NavLink key={path} to={path}
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              textDecoration: isActive ? "underline" : "none",
            })}>
            {path === "/" ? "Home" : path.slice(1)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToCart = () => {
    // Add item to cart state...
    navigate("/cart");
  };
  return (
    <div>
      <h2>Product {id}</h2>
      <button onClick={addToCart}>Add to Cart & View Cart</button>
    </div>
  );
}`,
  },
  {
    time: "Hour 7",
    title: "Performance — useMemo, useCallback, useTransition & React Compiler",
    concept: [
      "**Re-renders are React's core mechanism** — they're not inherently bad. React is fast by default. Only optimize when you measure a real performance problem. Premature optimization (wrapping everything in useMemo/useCallback) adds complexity without benefit. Use React DevTools Profiler to identify actual bottlenecks.",
      "**useMemo** caches expensive calculations between renders: `const sorted = useMemo(() => items.sort(compareFn), [items])`. Without useMemo, the sort runs on EVERY render. Use it when: (1) The computation is genuinely expensive (>1ms). (2) The input rarely changes. (3) The result is used as a dependency for other hooks or as a prop to memoized children.",
      "**useCallback** caches a function reference: `const handleClick = useCallback(() => { ... }, [deps])`. Without it, a new function is created on every render. This matters when: (1) Passing callbacks to `React.memo()` children (otherwise they re-render because the function reference changes). (2) Using as a useEffect dependency.",
      "**React.memo()** prevents a component from re-rendering if its props haven't changed (shallow comparison). Wrap child components: `const MemoizedList = React.memo(ExpensiveList)`. Now it only re-renders when its props actually change. Combine with useCallback for function props and useMemo for object/array props.",
      "**useTransition** marks state updates as non-urgent, keeping the UI responsive during heavy operations. `const [isPending, startTransition] = useTransition()`. Wrap the slow update: `startTransition(() => setFilteredList(hugeList.filter(...)))`. React continues rendering the old UI while computing the new one. **useDeferredValue** is similar but for values: `const deferredQuery = useDeferredValue(query)` — lets React delay updating a part of the UI.",
      "**React Compiler (React Forget)** — In React 19+, the experimental React Compiler automatically applies useMemo, useCallback, and memo optimizations at build time. It analyzes your code and adds memoization where beneficial. When available it eliminates the need for manual memoization in most codebases. Check: `npx react-compiler-healthcheck` to see if your code is compatible.",
    ],
    code: `import { useState, useMemo, useCallback, useTransition,
         useDeferredValue, memo } from "react";

// === 1. useMemo: Cache Expensive Computation ===
function FilteredList({ items, query }) {
  // Without useMemo, this runs on EVERY render
  const filtered = useMemo(() => {
    console.log("Filtering...", items.length, "items");
    return items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]); // Only re-run when items or query changes

  return <ul>{filtered.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// === 2. useCallback + React.memo: Prevent Child Re-renders ===
const ExpensiveChild = memo(function ExpensiveChild({ onClick, label }) {
  console.log("Rendering ExpensiveChild:", label);
  return <button onClick={onClick}>{label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  // Without useCallback, new function every render → child re-renders
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []); // Empty deps: function never changes

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <p>Count: {count}</p>
      {/* ExpensiveChild only re-renders when handleClick or label changes */}
      <ExpensiveChild onClick={handleClick} label="Increment" />
    </div>
  );
}

// === 3. useTransition: Keep UI Responsive ===
function HeavySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value); // Urgent: update input immediately

    startTransition(() => {
      // Non-urgent: filter 100k items, can be interrupted
      const allItems = generateHugeList();
      setResults(allItems.filter(i => i.includes(e.target.value)));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Updating results...</span>}
      <ul>{results.slice(0, 100).map((r, i) => <li key={i}>{r}</li>)}</ul>
    </div>
  );
}

// === 4. useDeferredValue: Defer Part of the UI ===
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  // Heavy computation uses the deferred (lagging) value
  const results = useMemo(() =>
    hugeDataset.filter(item => item.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <div style={{ opacity: isStale ? 0.6 : 1 }}>
      {results.map((r, i) => <li key={i}>{r}</li>)}
    </div>
  );
}

// === 5. Virtualization for Long Lists ===
// For lists with 1000+ items, use @tanstack/react-virtual
// It only renders visible items in the viewport
// import { useVirtualizer } from "@tanstack/react-virtual";
function VirtualizedList({ items }) {
  // const parentRef = useRef(null);
  // const virtualizer = useVirtualizer({
  //   count: items.length,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: () => 35,
  // });
  // Renders only ~20 visible rows instead of 10,000
  return <div>See @tanstack/react-virtual docs</div>;
}`,
    practice: "Build a dashboard with a heavy chart component. Use useTransition to keep the date-range filter responsive while the chart recalculates, and React.memo + useCallback to prevent unnecessary re-renders of sidebar components.",
    solution: `import { useState, useCallback, useMemo, useTransition, memo } from "react";

const Sidebar = memo(function Sidebar({ onFilterChange }) {
  console.log("Sidebar rendered");
  return (
    <aside>
      <h3>Filters</h3>
      <button onClick={() => onFilterChange("revenue")}>Revenue</button>
      <button onClick={() => onFilterChange("users")}>Users</button>
    </aside>
  );
});

const Chart = memo(function Chart({ data }) {
  console.log("Chart rendered with", data.length, "points");
  return (
    <div className="chart">
      {data.map((d, i) =>
        <div key={i} style={{ height: d.value, width: 4,
          background: "steelblue", display: "inline-block" }} />
      )}
    </div>
  );
});

function Dashboard() {
  const [dateRange, setDateRange] = useState("7d");
  const [metric, setMetric] = useState("revenue");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = useCallback((newMetric) => {
    setMetric(newMetric);
  }, []);

  const handleDateChange = (range) => {
    startTransition(() => setDateRange(range));
  };

  const chartData = useMemo(() => {
    // Simulate heavy computation
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 365;
    return Array.from({ length: days }, (_, i) => ({
      day: i, value: Math.random() * 100
    }));
  }, [dateRange]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onFilterChange={handleFilterChange} />
      <div>
        {["7d", "30d", "365d"].map(r =>
          <button key={r} onClick={() => handleDateChange(r)}>{r}</button>
        )}
        {isPending && <span>Loading chart...</span>}
        <Chart data={chartData} />
      </div>
    </div>
  );
}`,
  },
  {
    time: "Hour 8",
    title: "React Server Components, Suspense & Error Boundaries",
    concept: [
      "**React Server Components (RSC)** are components that render exclusively on the server and send HTML to the client — they ship ZERO JavaScript to the browser. Benefits: (1) Direct database/filesystem access. (2) Smaller bundle sizes. (3) Faster initial page loads. RSCs are the default in Next.js App Router — every component is a Server Component unless marked `'use client'`.",
      "**'use client' directive** marks a component (and its imports) as a Client Component. Client Components run in the browser and can use hooks, state, events, and browser APIs. Use them for: interactive forms, click handlers, useState, useEffect, animations, browser-only APIs. Keep the `'use client'` boundary as low as possible — wrap only the interactive parts.",
      "**Suspense** declares a loading boundary for async operations. Wrap any component that might suspend (lazy-loaded, data-fetching with `use()`, or RSC) in `<Suspense fallback={<Skeleton />}>`. React shows the fallback until the child resolves. You can nest Suspense boundaries to progressively reveal UI: header first, then sidebar, then main content.",
      "**Error Boundaries** catch rendering errors in child components and display a fallback UI instead of crashing the entire app. In React 19, create them as class components (the only remaining use case for classes): `static getDerivedStateFromError(error)` and `componentDidCatch(error, info)`. Wrap critical sections: `<ErrorBoundary fallback={<ErrorPage />}><Dashboard /></ErrorBoundary>`.",
      "**Streaming SSR** (Server-Side Rendering) with Suspense enables progressive page loading. The server sends the HTML in chunks: the shell arrives immediately, then each Suspense boundary resolves independently. Users see content faster because they don't wait for the entire page to render. This is default behavior in Next.js 14+ App Router.",
      "**When to use which rendering pattern:** (1) **RSC (Server)** — data fetching, database queries, heavy imports, no interactivity. (2) **Client Component** — interactivity, hooks, state, events. (3) **Streaming SSR** — personalized pages that need fast initial load. (4) **Static Generation** — marketing pages, blog posts, documentation. (5) **SPA (Client Only)** — admin dashboards where SEO doesn't matter.",
    ],
    code: `// === Next.js App Router Example ===
// This file is a SERVER COMPONENT by default (no 'use client')

// app/page.js — Server Component (can access database directly)
import { db } from "@/lib/database";

export default async function HomePage() {
  // This runs ON THE SERVER — no API needed!
  const products = await db.query("SELECT * FROM products LIMIT 10");

  return (
    <main>
      <h1>Featured Products</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList products={products} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <LatestReviews /> {/* Loads independently */}
      </Suspense>
    </main>
  );
}

// === Client Component (interactive) ===
// components/AddToCartButton.jsx
"use client"; // This annotation makes it a Client Component

import { useState, useTransition } from "react";

export function AddToCartButton({ productId }) {
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      setAdded(true);
    });
  };

  return (
    <button onClick={handleAdd} disabled={isPending}>
      {isPending ? "Adding..." : added ? "✓ Added" : "Add to Cart"}
    </button>
  );
}

// === Error Boundary (still requires a class in React 19) ===
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
    // Send to error reporting service (Sentry, DataDog, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-container">
            <h2>Something went wrong</h2>
            <pre>{this.state.error.message}</pre>
            <button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// Usage in layout:
// <ErrorBoundary fallback={<ErrorPage />}>
//   <Suspense fallback={<Skeleton />}>
//     <Dashboard />
//   </Suspense>
// </ErrorBoundary>`,
    practice: "Design a Next.js App Router page that: (1) Fetches user data as a Server Component, (2) Has an interactive 'Edit Profile' form as a Client Component, (3) Uses nested Suspense for progressive loading, and (4) Has an Error Boundary wrapping the profile section.",
    solution: `// app/profile/page.jsx — Server Component
import { Suspense } from "react";
import { db } from "@/lib/database";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function ProfilePage() {
  const user = await db.users.getCurrent();
  return (
    <main>
      <h1>My Profile</h1>
      <ErrorBoundary fallback={<p>Failed to load profile.</p>}>
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileCard user={user} />
        </Suspense>
        <Suspense fallback={<p>Loading activity...</p>}>
          <RecentActivity userId={user.id} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

async function RecentActivity({ userId }) {
  const activity = await db.activity.getByUser(userId);
  return (
    <ul>{activity.map(a => <li key={a.id}>{a.action} — {a.date}</li>)}</ul>
  );
}

// components/ProfileCard.jsx
"use client";
import { useState } from "react";

export default function ProfileCard({ user }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);

  const save = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <div>
          <input value={name} onChange={e => setName(e.target.value)} />
          <button onClick={save}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <h2>{name}</h2>
          <p>{user.email}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
}`,
  },
  {
    time: "Hour 9",
    title: "Production Project Bootstrap — Vite, TypeScript, Testing & CI/CD",
    concept: [
      "**Vite** is the standard build tool for React in 2025-2026 (Create React App is deprecated). It offers instant dev server startup via ESM, sub-second HMR (Hot Module Replacement), and optimized production builds using Rollup. Bootstrap: `npm create vite@latest my-app -- --template react-ts` for TypeScript, or `react` for JavaScript.",
      "**TypeScript is non-negotiable for production.** Enable `strict: true` in tsconfig.json. Key React types: `React.FC<Props>` (or just typed function parameters), `React.ReactNode` (anything renderable), `React.ChangeEvent<HTMLInputElement>` for events, `React.CSSProperties` for inline styles. Define prop types with interfaces: `interface UserCardProps { name: string; age: number; }`. Use generics for reusable hooks.",
      "**Production folder structure** — organize by feature, not by file type. Recommended layout: `src/features/` (auth, dashboard, products — each with components/, hooks/, api/), `src/components/` (shared Button, Modal, Input), `src/hooks/` (global custom hooks), `src/lib/` (API clients, configs), `src/pages/` (route-level components), `src/utils/` (helpers), and `src/types/` (shared TypeScript types).",
      "**Testing stack:** (1) **Vitest** — fast, Vite-native test runner (`npm i -D vitest`). (2) **React Testing Library** — test components by how users interact with them (`npm i -D @testing-library/react @testing-library/jest-dom`). (3) **MSW (Mock Service Worker)** — intercept and mock API requests. (4) **Playwright** — E2E browser testing. Test the behavior, NOT implementation details.",
      "**Code quality tooling:** (1) **ESLint** with `eslint-plugin-react-hooks` (catches hook rule violations) and `eslint-plugin-jsx-a11y` (accessibility). (2) **Prettier** for formatting. (3) **Husky + lint-staged** for pre-commit hooks: lint and format only staged files. (4) **TypeScript strict mode** as a safety net. This catches bugs before they reach production.",
      "**CI/CD pipeline** (GitHub Actions example): (1) Install dependencies with lockfile (`npm ci`). (2) Run TypeScript type-check (`tsc --noEmit`). (3) Run linting (`npm run lint`). (4) Run unit tests with coverage (`vitest run --coverage`). (5) Build production bundle (`npm run build`). (6) Run E2E tests against the built app. (7) Deploy to preview/staging (Vercel, AWS Amplify, Cloudflare Pages). (8) Deploy to production on merge to main.",
    ],
    code: `# === 1. Bootstrap a Production React + TypeScript Project ===

# Create project with Vite
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install core production dependencies
npm install react-router-dom @tanstack/react-query axios zustand

# Install dev/testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom msw
npm install -D eslint @eslint/js eslint-plugin-react-hooks
npm install -D eslint-plugin-jsx-a11y prettier
npm install -D husky lint-staged

# Initialize Husky for pre-commit hooks
npx husky init

# === 2. Production Folder Structure ===
# src/
# ├── assets/              # Images, fonts, global CSS
# ├── components/          # Shared, reusable UI components
# │   ├── Button/
# │   │   ├── Button.tsx
# │   │   ├── Button.test.tsx
# │   │   └── Button.module.css
# │   ├── Modal/
# │   └── Input/
# ├── features/            # Feature modules (domain-driven)
# │   ├── auth/
# │   │   ├── components/  # LoginForm, RegisterForm
# │   │   ├── hooks/       # useAuth, useSession
# │   │   ├── api/         # authApi.ts
# │   │   └── types.ts
# │   ├── products/
# │   └── cart/
# ├── hooks/               # Global custom hooks
# ├── lib/                 # 3rd-party configs (axios, query client)
# │   ├── apiClient.ts
# │   └── queryClient.ts
# ├── pages/               # Route-level components
# ├── routes/              # Route definitions
# ├── types/               # Shared TypeScript types
# ├── utils/               # Helper functions
# ├── App.tsx
# └── main.tsx

# === 3. tsconfig.json (strict production config) ===
# {
#   "compilerOptions": {
#     "strict": true,
#     "target": "ES2022",
#     "lib": ["ES2023", "DOM", "DOM.Iterable"],
#     "module": "ESNext",
#     "moduleResolution": "bundler",
#     "jsx": "react-jsx",
#     "baseUrl": ".",
#     "paths": { "@/*": ["./src/*"] },
#     "noUnusedLocals": true,
#     "noUnusedParameters": true,
#     "noFallthroughCasesInSwitch": true
#   },
#   "include": ["src"]
# }

# === 4. vitest.config.ts ===
# import { defineConfig } from "vitest/config";
# import react from "@vitejs/plugin-react";
#
# export default defineConfig({
#   plugins: [react()],
#   test: {
#     globals: true,
#     environment: "jsdom",
#     setupFiles: "./src/test/setup.ts",
#     css: true,
#     coverage: {
#       provider: "v8",
#       reporter: ["text", "json", "html"],
#       exclude: ["node_modules/", "src/test/"],
#     },
#   },
# });

# === 5. Example Test (React Testing Library) ===
# // src/components/Button/Button.test.tsx
# import { render, screen } from "@testing-library/react";
# import userEvent from "@testing-library/user-event";
# import { Button } from "./Button";
#
# describe("Button", () => {
#   it("renders with label", () => {
#     render(<Button label="Click me" />);
#     expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
#   });
#
#   it("calls onClick when clicked", async () => {
#     const handleClick = vi.fn();
#     render(<Button label="Click" onClick={handleClick} />);
#     await userEvent.click(screen.getByRole("button"));
#     expect(handleClick).toHaveBeenCalledOnce();
#   });
#
#   it("is disabled when loading", () => {
#     render(<Button label="Submit" loading />);
#     expect(screen.getByRole("button")).toBeDisabled();
#   });
# });

# === 6. GitHub Actions CI/CD ===
# .github/workflows/ci.yml
# name: CI
# on: [push, pull_request]
# jobs:
#   build-and-test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with: { node-version: 20 }
#       - run: npm ci
#       - run: npx tsc --noEmit           # Type check
#       - run: npm run lint                # Lint
#       - run: npx vitest run --coverage   # Test
#       - run: npm run build               # Build`,
    practice: "Set up a brand-new Vite + React + TypeScript project. Add: (1) Path aliases (@/ for src/). (2) A feature module folder (auth) with a typed useAuth hook. (3) A Button component with a test file. (4) ESLint config with react-hooks and jsx-a11y plugins. (5) A pre-commit hook that runs lint + type-check.",
    solution: `# Step-by-step commands:

# 1. Create project
npm create vite@latest my-prod-app -- --template react-ts
cd my-prod-app && npm install

# 2. Add path aliases in vite.config.ts
# import path from "path";
# resolve: { alias: { "@": path.resolve(__dirname, "./src") } },

# 3. Create feature module
mkdir -p src/features/auth/{components,hooks,api}

# src/features/auth/hooks/useAuth.ts
# import { useState, useCallback } from "react";
#
# interface User { id: string; email: string; name: string; }
# interface AuthState { user: User | null; token: string | null; }
#
# export function useAuth() {
#   const [auth, setAuth] = useState<AuthState>({ user: null, token: null });
#
#   const login = useCallback(async (email: string, password: string) => {
#     const res = await fetch("/api/auth/login", {
#       method: "POST",
#       headers: { "Content-Type": "application/json" },
#       body: JSON.stringify({ email, password }),
#     });
#     const data = await res.json();
#     setAuth({ user: data.user, token: data.token });
#   }, []);
#
#   const logout = useCallback(() => {
#     setAuth({ user: null, token: null });
#   }, []);
#
#   return { ...auth, login, logout, isAuthenticated: !!auth.user };
# }

# 4. Install testing + quality tools
npm i -D vitest @testing-library/react @testing-library/jest-dom
npm i -D eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y
npm i -D husky lint-staged prettier

# 5. Setup husky pre-commit
npx husky init
echo "npx lint-staged" > .husky/pre-commit

# Add to package.json:
# "lint-staged": {
#   "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
#   "*.{json,css,md}": ["prettier --write"]
# }`,
  },
  {
    time: "Hour 10",
    title: "Backend Integration — Spring Boot, FastAPI, Express & Docker Compose",
    concept: [
      "**React is backend-agnostic.** It communicates with ANY backend via HTTP APIs (REST or GraphQL). The key is building a clean API service layer that abstracts the backend technology. Whether your API is Spring Boot (Java), FastAPI (Python), Express (Node.js), or Go — React doesn't care. It sends requests and handles responses.",
      "**API Service Layer pattern:** Create separate Axios instances for each backend with distinct base URLs, interceptors, and error handling. Never use raw `fetch()` or `axios.get()` calls inside components — abstract them into service functions. This centralizes configuration (auth tokens, error handling, retry logic) and makes backend swaps trivial.",
      "**TanStack Query (React Query)** is the industry standard for API integration. It provides: (1) Automatic caching & deduplication. (2) Background refetching. (3) Loading/error/success states without useEffect. (4) Pagination & infinite scroll helpers. (5) Optimistic updates. (6) Automatic retry on failure. `const { data, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });`",
      "**CORS (Cross-Origin Resource Sharing)** is the #1 pain point when connecting React to a separate backend. In development, use Vite's proxy: add `server: { proxy: { '/api': 'http://localhost:8080' } }` to vite.config.ts. In production, configure CORS headers on the backend: Spring Boot uses `@CrossOrigin` or `WebMvcConfigurer`, FastAPI uses `CORSMiddleware`, Express uses the `cors` package.",
      "**Authentication flow:** (1) User submits credentials. (2) Backend returns a JWT token. (3) React stores the token (httpOnly cookie is safest, or localStorage for simplicity). (4) Axios interceptor attaches the token to every subsequent request: `headers.Authorization = 'Bearer ' + token`. (5) Interceptor catches 401 responses and redirects to login or refreshes the token.",
      "**Docker Compose for full-stack development:** Define React (Vite dev server), backend(s), and database in one `docker-compose.yml`. Use Docker networking so services talk via service names instead of localhost. Frontend proxies to `http://api:8080` instead of `http://localhost:8080`. This eliminates 'works on my machine' problems and mirrors production infrastructure.",
    ],
    code: `// === 1. API Service Layer (Axios Instances) ===
// src/lib/apiClient.ts
import axios from "axios";

// Spring Boot backend
export const springApi = axios.create({
  baseURL: import.meta.env.VITE_SPRING_API_URL || "/api/spring",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// FastAPI backend
export const fastApi = axios.create({
  baseURL: import.meta.env.VITE_FASTAPI_URL || "/api/python",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Auth interceptor — attach JWT to every request
const attachToken = (config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
};
springApi.interceptors.request.use(attachToken);
fastApi.interceptors.request.use(attachToken);

// Global error interceptor — handle 401 redirect
const handleAuthError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  return Promise.reject(error);
};
springApi.interceptors.response.use(r => r, handleAuthError);
fastApi.interceptors.response.use(r => r, handleAuthError);

// === 2. Service Functions (one per domain) ===
// src/features/products/api/productApi.ts
export const productApi = {
  getAll: (params) => springApi.get("/products", { params }),
  getById: (id) => springApi.get("/products/" + id),
  create: (data) => springApi.post("/products", data),
  update: (id, data) => springApi.put("/products/" + id, data),
  delete: (id) => springApi.delete("/products/" + id),
};

// AI-powered endpoints via FastAPI
export const aiApi = {
  recommend: (userId) => fastApi.post("/recommend", { userId }),
  search: (query) => fastApi.post("/semantic-search", { query }),
};

// === 3. TanStack Query Integration ===
// src/features/products/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export function useProducts(filters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productApi.getAll(filters).then(r => r.data),
    staleTime: 5 * 60 * 1000,    // Cache for 5 minutes
    refetchOnWindowFocus: true,   // Refresh when user returns
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productApi.getById(id).then(r => r.data),
    enabled: !!id,                // Don't fetch if no ID
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productApi.create(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// === 4. Usage in Components ===
function ProductList() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading, error } = useProducts({ search });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// === 5. Vite Proxy Config (CORS in Development) ===
// vite.config.ts
// export default defineConfig({
//   server: {
//     proxy: {
//       "/api/spring": {
//         target: "http://localhost:8080",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\\/api\\/spring/, "/api"),
//       },
//       "/api/python": {
//         target: "http://localhost:8000",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\\/api\\/python/, "/api"),
//       },
//     },
//   },
// });

// === 6. Backend CORS Configuration ===

// --- Spring Boot (Java) ---
// @Configuration
// public class CorsConfig implements WebMvcConfigurer {
//     @Override
//     public void addCorsMappings(CorsRegistry registry) {
//         registry.addMapping("/api/**")
//             .allowedOrigins("http://localhost:5173",
//                             "https://myapp.example.com")
//             .allowedMethods("GET","POST","PUT","DELETE")
//             .allowCredentials(true);
//     }
// }

// --- FastAPI (Python) ---
// from fastapi import FastAPI
// from fastapi.middleware.cors import CORSMiddleware
//
// app = FastAPI()
// app.add_middleware(
//     CORSMiddleware,
//     allow_origins=["http://localhost:5173",
//                     "https://myapp.example.com"],
//     allow_credentials=True,
//     allow_methods=["*"],
//     allow_headers=["*"],
// )

// --- Express (Node.js) ---
// const cors = require("cors");
// app.use(cors({
//   origin: ["http://localhost:5173", "https://myapp.example.com"],
//   credentials: true,
// }));`,
    practice: "Design a full-stack Docker Compose setup with: (1) React Vite frontend, (2) Spring Boot API for CRUD, (3) FastAPI for AI/ML features, (4) PostgreSQL database. Write the docker-compose.yml, the Vite proxy config, and an API service layer that routes requests to the correct backend.",
    solution: `# docker-compose.yml
# version: "3.9"
# services:
#   frontend:
#     build: ./frontend
#     ports: ["5173:5173"]
#     environment:
#       - VITE_SPRING_API_URL=http://api-spring:8080/api
#       - VITE_FASTAPI_URL=http://api-python:8000/api
#     depends_on: [api-spring, api-python]
#
#   api-spring:
#     build: ./backend-spring
#     ports: ["8080:8080"]
#     environment:
#       - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/myapp
#       - SPRING_DATASOURCE_USERNAME=postgres
#       - SPRING_DATASOURCE_PASSWORD=secret
#     depends_on: [db]
#
#   api-python:
#     build: ./backend-python
#     ports: ["8000:8000"]
#     environment:
#       - DATABASE_URL=postgresql://postgres:secret@db:5432/myapp
#       - OPENAI_API_KEY=sk-...
#     depends_on: [db]
#
#   db:
#     image: postgres:16-alpine
#     environment:
#       POSTGRES_DB: myapp
#       POSTGRES_PASSWORD: secret
#     volumes:
#       - pgdata:/var/lib/postgresql/data
#     ports: ["5432:5432"]
#
# volumes:
#   pgdata:

# Frontend API service layer:
# src/lib/apiClient.ts
import axios from "axios";

const isDocker = import.meta.env.VITE_DOCKER === "true";

export const springApi = axios.create({
  baseURL: isDocker ? "http://api-spring:8080/api" : "/api/spring",
});

export const fastApi = axios.create({
  baseURL: isDocker ? "http://api-python:8000/api" : "/api/python",
});

// Feature services use the appropriate instance:
export const userService = {
  list: () => springApi.get("/users"),
  create: (d) => springApi.post("/users", d),
};

export const aiService = {
  recommend: (uid) => fastApi.post("/recommend", { userId: uid }),
  chat: (msg) => fastApi.post("/chat", { message: msg }),
};`,
  },
  {
    time: "Hour 7",
    title: "Client-Side Performance at Scale: Virtualization & Lazy Loading",
    concept: [
      "**React.memo & useMemo:** Prevent unnecessary re-renders. `React.memo` wraps a component to render only if its props change. `useMemo` caches the result of expensive calculations. `useCallback` caches a function definition. These are vital for heavy client-side apps, but don't overuse them—React is fast by default. Use them when profiling shows a bottleneck.",
      "**List Virtualization:** When rendering 10,000+ items, the DOM becomes the bottleneck. Virtualization libraries like `react-window` or `react-virtuoso` fix this by only rendering the 10-20 items currently visible on the screen, recycling DOM nodes as you scroll. This turns a 100MB DOM into a 1MB DOM and keeps 60FPS.",
      "**Lazy Loading & Code Splitting:** Don't send your entire JavaScript bundle to the user at once. Use `const Chart = lazy(() => import('./Chart'))` to load components only when they are rendered. Wrap them in `<Suspense fallback={<Spinner />}>`. Split routes, large libraries, and dialogs into separate chunks.",
      "**Web Workers:** React runs on the main thread. If you run a loop 10,000,000 times, the browser freezes. Web Workers run scripts in background threads. Use libraries like `comlink` to easily offload heavy data processing, parsing, or sorting to a Web Worker, freeing up the UI thread.",
      "**Debouncing & Throttling:** Rapid state updates (typing in search, scrolling, resizing) cause frame drops. `useDebounce` waits until the user stops typing for X ms. `useThrottle` limits executions to once every X ms. Use them for API calls and heavy UI updates.",
      "**Intersection Observer:** Don't load images outside the viewport. Use Intersection Observer to detect when an element enters the screen and only then fetch its image or trigger heavy animations. This drastically improves Initial Load times."
    ],
    code: `import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { FixedSizeList as List } from "react-window";

// === 1. Memoization Example ===
const ExpensiveRow = React.memo(({ item, onSelect }) => {
  console.log("Rendered", item.id);
  return <div onClick={() => onSelect(item.id)}>{item.name}</div>;
});

function MemoDemo() {
  const [count, setCount] = useState(0);
  const [items] = useState([{ id: 1, name: "A" }, { id: 2, name: "B" }]);

  // useCallback keeps the reference stable across renders
  const handleSelect = useCallback((id) => {
    console.log("Selected", id);
  }, []); 

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {items.map(item => (
        <ExpensiveRow key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </div>
  );
}

// === 2. List Virtualization (react-window) ===
function VirtualizedList({ heavyItems }) {
  // Render function for visible rows only
  const renderRow = ({ index, style }) => (
    <div style={style}>Row {heavyItems[index].name}</div>
  );

  return (
    <List
      height={400}         // Container height
      itemCount={100000}   // Total items
      itemSize={35}        // Row height
      width={300}          // Container width
    >
      {renderRow}
    </List>
  );
}

// === 3. Code Splitting / Lazy Loading ===
// Only loaded when HeavyDashboard is rendered
const HeavyDashboard = lazy(() => import("./HeavyDashboard"));

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDashboard(true)}>Load Dashboard</button>
      {showDashboard && (
        <Suspense fallback={<div>Loading Dashboard Chunk...</div>}>
          <HeavyDashboard />
        </Suspense>
      )}
    </div>
  );
}`,
    practice: "Build a virtualized contact list holding 50,000 items using react-window. Implement a debounced search input to filter the list. Ensure the Individual row components are wrapped in React.memo and the select function uses useCallback.",
    solution: `import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FixedSizeList as List } from "react-window";

const allContacts = Array.from({ length: 50000 }, (_, i) => ({ id: i, name: \`Contact \${i}\` }));

const useDebounce = (val, ms) => {
  const [debounced, setDebounced] = useState(val);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(val), ms);
    return () => clearTimeout(timer);
  }, [val, ms]);
  return debounced;
};

const ContactRow = React.memo(({ data, index, style }) => {
  const { filtered, onSelect } = data;
  const contact = filtered[index];
  return (
    <div style={{ ...style, borderBottom: "1px solid #eee", padding: 8 }}
         onClick={() => onSelect(contact.id)}>
      {contact.name}
    </div>
  );
});

export default function App() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => 
    allContacts.filter(c => c.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
  [debouncedSearch]);

  const handleSelect = useCallback((id) => console.log("Selected", id), []);

  const itemData = useMemo(() => ({
    filtered, onSelect: handleSelect
  }), [filtered, handleSelect]);

  return (
    <div>
      <input type="text" placeholder="Search 50k contacts..."
             value={search} onChange={e => setSearch(e.target.value)}
             style={{ padding: 10, width: "100%", marginBottom: 10 }} />
      <List height={500} itemCount={filtered.length} itemSize={40} width="100%" itemData={itemData}>
        {ContactRow}
      </List>
    </div>
  );
}`
  },
  {
    time: "Hour 8",
    title: "Enterprise Scale Architecture: SSR, Caching & Atomic State",
    concept: [
      "**Next.js & Server-Side Rendering (SSR):** With 100k+ users, offloading initial renders to the server speeds up LCP (Largest Contentful Paint) and drastically improves SEO. Next.js App Router uses React Server Components (RSC) to render UI on the server with zero client-side JavaScript, shipping only HTML.",
      "**Client-Side Caching (TanStack Query):** Stop refetching data everywhere. Tools like TanStack (React) Query cache API responses. They handle 'stale-while-revalidate', background updates, automatic retries, and deduplication. If 5 components request the same user object, only 1 network request is made.",
      "**Atomic State vs. Context:** React Context triggers updates on EVERY consumer when the value changes. For massive apps with lots of frequent state updates, avoid Context. Use atomic state managers like **Zustand** or **Jotai**. They allow subscribing to specific slices of state, preventing cascading UI re-renders.",
      "**Edge Caching & CDNs:** Serve static assets (JS chunks, images, CSS) from a CDN (CloudFront/Cloudflare) using Brotli compression. Implement aggressive Cache-Control headers (`public, max-age=31536000, immutable`) for hashed Vite/Webpack assets.",
      "**Image Optimization:** Never render a 4MB 4K PNG. Use Next/Image or Vite plugins to create `webp` / `avif` formats dynamically with `srcset` for responsive design. Use a blur-hash placeholder to prevent Cumulative Layout Shift (CLS).",
      "**Micro-Frontends & Architecture:** At massive engineering scale, entire React apps are split into independent Micro-Frontends (e.g. via Webpack Module Federation) allowing teams to deploy sections of the app independently. It scales organizationally as well as technically."
    ],
    code: `// === 1. Server Components & SSR (Next.js App Router) ===
import { Suspense } from "react";

// Server-side fetch (using standard fetch API patched by Next)
async function getUsers() {
  const res = await fetch("https://api.example.com/users", {
    next: { revalidate: 60 } // Incrementally Static Revalidate (ISR) every 60s
  });
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers(); // Blocks rendering until data is here
  
  return (
    <main>
      <h1>100k User Directory (SSR)</h1>
      <Suspense fallback={<p>Loading user list...</p>}>
        <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
      </Suspense>
    </main>
  );
}

// === 2. TanStack Query for Heavy Client Data ===
import { useQuery } from "@tanstack/react-query";

function UserProfile({ id }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(\`/api/users/\${id}\`).then(r => r.json()),
    staleTime: 1000 * 60 * 10,  // Cache remains fresh for 10 minutes
    gcTime: 1000 * 60 * 60      // Keep in memory for 1 hour
  });

  if (isLoading) return <p>Loading...</p>;
  return <div>{data.name}</div>;
}

// === 3. Atomic State with Zustand ===
import { create } from 'zustand';

// Store is outside React
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  // Subscribes only to "count"
  const count = useStore((state) => state.count);
  return <h1>{count}</h1>;
}

function Controls() {
  // Does not re-render when count changes!
  const inc = useStore((state) => state.inc);
  return <button onClick={inc}>Increment</button>;
}`,
    practice: "Set up a Zustand store for an eCommerce cart. Include arrays and total. Create two components: CartIcon (subscribes only to `items.length`) and Checkout (subscribes to everything). Observe how CartIcon avoids re-renders on price changes.",
    solution: `import React from 'react';
import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  addItem: (product) => set((state) => ({ items: [...state.items, product] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  getTotal: () => get().items.reduce((sum, item) => sum + item.price, 0),
}));

// Subscribes ONLY to length
function CartNavIcon() {
  const itemCount = useCartStore((state) => state.items.length);
  return <div>🛒 {itemCount} items</div>;
}

function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div>
      <h2>Checkout</h2>
      {items.map(item => (
        <div key={item.id}>
          {item.name} - $\{item.price} <button onClick={() => removeItem(item.id)}>X</button>
        </div>
      ))}
      <h3>Total: $\{getTotal().toFixed(2)}</h3>
    </div>
  );
}

export default function App() {
  const addItem = useCartStore((state) => state.addItem);
  return (
    <div>
      <CartNavIcon />
      <button onClick={() => addItem({ id: Date.now(), name: "Robot", price: 99.99 })}>
        Add Robot
      </button>
      <CheckoutPage />
    </div>
  );
}`
  }
];
