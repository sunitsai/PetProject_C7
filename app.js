// Minimal React (UMD) interoperability
const React = window.React;
const ReactDOM = window.ReactDOM;

// --- Storage helpers ---
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// Seed demo data if empty
(function seed() {
  if (!storage.get("users", null)) {
    storage.set("users", [{ id: 1, email: "admin@example.com", password: "admin123" }]);
  }
  if (!storage.get("pets", null)) {
    storage.set("pets", [
      { id: 1, name: "Mochi", species: "Cat", age: 3, ownerEmail: "admin@example.com", notes: "Shy but sweet." },
      { id: 2, name: "Bolt", species: "Dog", age: 5, ownerEmail: "admin@example.com", notes: "Loves fetch." }
    ]);
  }
})();

// --- Simple Hash Router ---
function useHashRoute() {
  const [route, setRoute] = React.useState(window.location.hash || "#/login");
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [route, (to) => (window.location.hash = to)];
}

// --- Auth context ---
const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = React.useState(storage.get("sessionUser", null));
  const login = (email, password) => {
    const users = storage.get("users", []);
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      storage.set("sessionUser", found);
      setUser(found);
      return { ok: true };
    }
    return { ok: false, error: "Invalid email or password." };
  };
  const signup = (email, password) => {
    const users = storage.get("users", []);
    if (users.some(u => u.email === email)) {
      return { ok: false, error: "Email already registered." };
    }
    const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const nu = { id, email, password };
    users.push(nu);
    storage.set("users", users);
    storage.set("sessionUser", nu);
    setUser(nu);
    return { ok: true };
  };
  const logout = () => {
    localStorage.removeItem("sessionUser");
    setUser(null);
  };
  return React.createElement(AuthContext.Provider, { value: { user, login, signup, logout } }, children);
}

function useAuth() {
  return React.useContext(AuthContext);
}

// --- UI Components ---
function TextInput({ label, value, onChange, type="text", placeholder="" }) {
  return React.createElement("label", { className: "block" },
    React.createElement("span", { className: "text-sm text-zinc-300" }, label),
    React.createElement("input", {
      type,
      value,
      onChange: e => onChange(e.target.value),
      placeholder,
      className: "mt-1 w-full rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring focus:ring-brand-600"
    })
  );
}

function Button({ children, onClick, variant="primary", className="" }) {
  const base = "rounded-xl px-4 py-2 font-medium transition";
  const styles = variant === "primary"
    ? "bg-brand-600 hover:bg-brand-700 text-white"
    : variant === "ghost"
      ? "bg-transparent hover:bg-zinc-800 text-zinc-200 border border-zinc-700"
      : "bg-zinc-700 text-white";
  return React.createElement("button", { onClick, className: `${base} ${styles} ${className}` }, children);
}

function Card({ children }) {
  return React.createElement("div", { className: "rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-lg p-6" }, children);
}

// --- Login / Sign Up Page ---
function LoginSignupPage() {
  const { user, login, signup } = useAuth();
  const [, navigate] = useHashRoute();
  const [mode, setMode] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user) navigate("#/dashboard");
  }, [user]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const action = mode === "login" ? login(email, password) : signup(email, password);
    if (!action.ok) setError(action.error);
  }

  return React.createElement("div", { className: "min-h-screen grid place-items-center p-4" },
    React.createElement(Card, null,
      React.createElement("div", { className: "mb-6 text-center" },
        React.createElement("h1", { className: "text-2xl font-bold" }, mode === "login" ? "Welcome back" : "Create your account"),
        React.createElement("p", { className: "text-zinc-400 mt-1" }, "Pet Manager")
      ),
      error && React.createElement("div", { className: "mb-4 text-red-400 text-sm" }, error),
      React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4 w-80" },
        React.createElement(TextInput, { label: "Email", value: email, onChange: setEmail, type: "email", placeholder: "you@example.com" }),
        React.createElement(TextInput, { label: "Password", value: password, onChange: setPassword, type: "password", placeholder: "••••••••" }),
        React.createElement(Button, { className: "w-full", onClick: handleSubmit }, mode === "login" ? "Log in" : "Sign up")
      ),
      React.createElement("div", { className: "mt-4 text-sm text-zinc-400 text-center" },
        mode === "login"
          ? React.createElement("span", null, "New here? ", React.createElement("a", { href: "#", onClick: e => { e.preventDefault(); setMode("signup"); }, className: "text-brand-500 hover:underline" }, "Create an account"))
          : React.createElement("span", null, "Already have an account? ", React.createElement("a", { href: "#", onClick: e => { e.preventDefault(); setMode("login"); }, className: "text-brand-500 hover:underline" }, "Log in"))
      )
    )
  );
}

// --- Dashboard (Pet List) ---
function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useHashRoute();
  const [pets, setPets] = React.useState(storage.get("pets", []));
  const [filter, setFilter] = React.useState("");
  const [editing, setEditing] = React.useState(null); // pet object or null
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!user) navigate("#/login");
  }, [user]);

  function savePet(pet) {
    const list = storage.get("pets", []);
    if (pet.id) {
      const idx = list.findIndex(p => p.id === pet.id);
      if (idx >= 0) list[idx] = pet;
    } else {
      pet.id = list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
      list.push(pet);
    }
    storage.set("pets", list);
    setPets(list);
    setShowForm(false);
    setEditing(null);
  }

  function deletePet(id) {
    const list = storage.get("pets", []).filter(p => p.id !== id);
    storage.set("pets", list);
    setPets(list);
  }

  const filtered = pets.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.species.toLowerCase().includes(filter.toLowerCase())
  );

  return React.createElement("div", { className: "min-h-screen" },
    // Top bar
    React.createElement("header", { className: "sticky top-0 bg-zinc-950/70 backdrop-blur border-b border-zinc-800" },
      React.createElement("div", { className: "max-w-5xl mx-auto flex items-center justify-between p-4" },
        React.createElement("div", { className: "flex items-center gap-2" },
          React.createElement("div", { className: "w-8 h-8 rounded-xl bg-brand-600 grid place-items-center font-bold" }, "P"),
          React.createElement("h1", { className: "text-lg font-semibold" }, "Pet Manager")
        ),
        React.createElement("div", { className: "flex items-center gap-2" },
          React.createElement("input", {
            placeholder: "Search by name or species",
            value: filter,
            onChange: e => setFilter(e.target.value),
            className: "rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-brand-600"
          }),
          React.createElement(Button, { variant: "ghost", onClick: () => { setEditing(null); setShowForm(true); } }, "Add Pet"),
          React.createElement(Button, { variant: "ghost", onClick: logout }, "Logout")
        )
      )
    ),
    // Content
    React.createElement("main", { className: "max-w-5xl mx-auto p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4" },
      filtered.map(pet => React.createElement(PetCard, {
        key: pet.id, pet,
        onEdit: () => { setEditing(pet); setShowForm(true); },
        onDelete: () => deletePet(pet.id)
      }))
    ),
    showForm && React.createElement(Modal, { onClose: () => setShowForm(false) },
      React.createElement(PetForm, { initial: editing, ownerEmail: (user && user.email) || "", onSave: savePet })
    )
  );
}

function PetCard({ pet, onEdit, onDelete }) {
  return React.createElement("div", { className: "rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex flex-col gap-2" },
    React.createElement("div", { className: "flex items-center justify-between" },
      React.createElement("div", { className: "font-semibold text-lg" }, pet.name),
      React.createElement("span", { className: "text-xs text-zinc-400" }, `#${pet.id}`)
    ),
    React.createElement("div", { className: "text-zinc-300 text-sm" }, pet.species, " • ", pet.age, " yrs"),
    React.createElement("div", { className: "text-zinc-400 text-sm line-clamp-2" }, pet.notes || "—"),
    React.createElement("div", { className: "mt-2 flex gap-2" },
      React.createElement(Button, { variant: "ghost", onClick: onEdit }, "Edit"),
      React.createElement(Button, { variant: "ghost", onClick: onDelete }, "Delete")
    )
  );
}

function Modal({ children, onClose }) {
  return React.createElement("div", { className: "fixed inset-0 bg-black/60 grid place-items-center p-4 z-50" },
    React.createElement("div", { className: "w-full max-w-lg" },
      React.createElement("div", { className: "rounded-2xl bg-zinc-900 border border-zinc-800 p-6" },
        children,
        React.createElement("div", { className: "mt-4 text-right" },
          React.createElement(Button, { variant: "ghost", onClick: onClose }, "Close")
        )
      )
    )
  );
}

function PetForm({ initial, ownerEmail, onSave }) {
  const [name, setName] = React.useState(initial?.name || "");
  const [species, setSpecies] = React.useState(initial?.species || "");
  const [age, setAge] = React.useState(initial?.age || 0);
  const [notes, setNotes] = React.useState(initial?.notes || "");

  const submit = e => {
    e.preventDefault();
    const pet = {
      id: initial?.id,
      name, species, age: Number(age),
      ownerEmail,
      notes
    };
    onSave(pet);
  };

  return React.createElement("form", { onSubmit: submit, className: "space-y-4" },
    React.createElement("h2", { className: "text-xl font-semibold" }, initial ? "Edit Pet" : "Add Pet"),
    React.createElement(TextInput, { label: "Name", value: name, onChange: setName, placeholder: "Mochi" }),
    React.createElement(TextInput, { label: "Species", value: species, onChange: setSpecies, placeholder: "Cat / Dog / ..." }),
    React.createElement(TextInput, { label: "Age (years)", value: age, onChange: setAge, type: "number", placeholder: "3" }),
    React.createElement("label", { className: "block" },
      React.createElement("span", { className: "text-sm text-zinc-300" }, "Notes / Details"),
      React.createElement("textarea", {
        value: notes,
        onChange: e => setNotes(e.target.value),
        rows: 3,
        className: "mt-1 w-full rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700 px-3 py-2 focus:outline-none focus:ring focus:ring-brand-600"
      })
    ),
    React.createElement("div", { className: "flex gap-2 justify-end" },
      React.createElement(Button, { variant: "ghost", onClick: (e) => { e.preventDefault(); onSave({ id: initial?.id, name, species, age: Number(age), ownerEmail, notes }); } }, initial ? "Save" : "Create")
    )
  );
}

// --- Root ---
function App() {
  const [route] = useHashRoute();
  const { user } = useAuth();

  let content = null;
  if (route.startsWith("#/dashboard")) {
    content = React.createElement(Dashboard);
  } else {
    content = React.createElement(LoginSignupPage);
  }

  return React.createElement("div", { className: "h-full" }, content);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(AuthProvider, null,
    React.createElement(App)
  )
);
