import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("vetcare_token");
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Wystąpił błąd");
  }

  return data;
}

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = Boolean(getToken());

  function logout() {
    localStorage.removeItem("vetcare_token");
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon">🐾</span>
          VetCare
        </Link>

        {loggedIn && (
          <button className="logout-button" onClick={logout}>
            Wyloguj
          </button>
        )}
      </header>

      {loggedIn && (
        <nav className="navigation">
          <Link
            className={location.pathname === "/pets" ? "active" : ""}
            to="/pets"
          >
            Zwierzęta
          </Link>

          <Link
            className={
              location.pathname === "/pet-form" ? "active" : ""
            }
            to="/pet-form"
          >
            Dodaj zwierzę
          </Link>

          <Link
            className={location.pathname === "/about" ? "active" : ""}
            to="/about"
          >
            O aplikacji
          </Link>
        </nav>
      )}

      <main className="content">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        });

        setMessage("Konto zostało utworzone. Możesz się zalogować.");
        setMode("login");
        return;
      }

      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("vetcare_token", data.access_token);
      navigate("/pets");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-logo">🐾</div>

      <h1>{mode === "login" ? "Witaj w VetCare" : "Załóż konto"}</h1>

      <p className="muted">
        Zarządzaj profilami zwierząt w jednym miejscu.
      </p>

      <form onSubmit={submit}>
        <label>
          Adres e-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Hasło
          <input
            type="password"
            value={password}
            minLength="6"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {message && <p className="message">{message}</p>}

        <button className="primary-button" disabled={loading}>
          {loading
            ? "Proszę czekać..."
            : mode === "login"
              ? "Zaloguj się"
              : "Zarejestruj się"}
        </button>
      </form>

      <button
        className="text-button"
        onClick={() =>
          setMode(mode === "login" ? "register" : "login")
        }
      >
        {mode === "login"
          ? "Nie masz konta? Zarejestruj się"
          : "Masz już konto? Zaloguj się"}
      </button>
    </section>
  );
}

function PetsPage() {
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [message, setMessage] = useState("Ładowanie danych...");
  const [offline, setOffline] = useState(!navigator.onLine);

  async function loadPets() {
    try {
      const data = await apiRequest("/pets");

      setPets(data);
      localStorage.setItem("vetcare_pets", JSON.stringify(data));
      setMessage(data.length ? "" : "Nie dodano jeszcze zwierząt.");
    } catch (error) {
      const cachedPets = JSON.parse(
        localStorage.getItem("vetcare_pets") || "[]",
      );

      setPets(cachedPets);

      setMessage(
        cachedPets.length
          ? "Brak połączenia — wyświetlane są zapisane dane."
          : error.message,
      );
    }
  }

  useEffect(() => {
    loadPets();

    function onlineHandler() {
      setOffline(false);
      loadPets();
    }

    function offlineHandler() {
      setOffline(true);
    }

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  async function deletePet(id) {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć to zwierzę?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/pets/${id}`, {
        method: "DELETE",
      });

      await loadPets();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Twoje zwierzęta</h1>
          <p className="muted">
            Profile zwierząt przypisane do Twojego konta.
          </p>
        </div>

        <button
          className="primary-button small-button"
          onClick={() => navigate("/pet-form")}
        >
          + Dodaj zwierzę
        </button>
      </div>

      {offline && (
        <div className="offline-banner">
          Tryb offline — korzystasz z danych zapisanych na urządzeniu.
        </div>
      )}

      {message && <p className="message">{message}</p>}

      <div className="pet-grid">
        {pets.map((pet) => (
          <article className="pet-card" key={pet.id}>
            <div className="pet-avatar">
              {pet.species.toLowerCase().includes("kot") ? "🐱" : "🐶"}
            </div>

            <div>
              <h2>{pet.name}</h2>
              <p>
                <strong>Gatunek:</strong> {pet.species}
              </p>
              <p>
                <strong>Rasa:</strong> {pet.breed || "Nie podano"}
              </p>
              <p>
                <strong>Data urodzenia:</strong>{" "}
                {pet.birth_date || "Nie podano"}
              </p>
            </div>

            <div className="card-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  navigate("/pet-form", {
                    state: {
                      pet,
                    },
                  })
                }
              >
                Edytuj
              </button>

              <button
                className="danger-button"
                onClick={() => deletePet(pet.id)}
              >
                Usuń
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PetFormPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const editedPet = location.state?.pet;

  const [form, setForm] = useState({
    name: editedPet?.name || "",
    species: editedPet?.species || "Pies",
    breed: editedPet?.breed || "",
    birth_date: editedPet?.birth_date || "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function changeField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      birth_date: form.birth_date || null,
    };

    try {
      if (editedPet) {
        await apiRequest(`/pets/${editedPet.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/pets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      navigate("/pets");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card">
      <h1>{editedPet ? "Edytuj zwierzę" : "Dodaj zwierzę"}</h1>

      <p className="muted">
        Wprowadź podstawowe dane zwierzęcia.
      </p>

      <form onSubmit={submit}>
        <label>
          Imię
          <input
            name="name"
            value={form.name}
            onChange={changeField}
            required
          />
        </label>

        <label>
          Gatunek
          <select
            name="species"
            value={form.species}
            onChange={changeField}
          >
            <option value="Pies">Pies</option>
            <option value="Kot">Kot</option>
            <option value="Inny">Inny</option>
          </select>
        </label>

        <label>
          Rasa
          <input
            name="breed"
            value={form.breed}
            onChange={changeField}
          />
        </label>

        <label>
          Data urodzenia
          <input
            type="date"
            name="birth_date"
            value={form.birth_date}
            onChange={changeField}
          />
        </label>

        {message && <p className="message">{message}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/pets")}
          >
            Anuluj
          </button>

          <button className="primary-button" disabled={loading}>
            {loading ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="about-card">
      <div className="about-icon">🐾</div>

      <h1>O aplikacji VetCare</h1>

      <p>
        VetCare jest aplikacją PWA do przechowywania podstawowych
        informacji o zwierzętach.
      </p>

      <div className="feature-list">
        <div>
          <strong>REST API</strong>
          <span>Wspólne dane dla PWA i aplikacji mobilnej.</span>
        </div>

        <div>
          <strong>Tryb offline</strong>
          <span>Ostatnio pobrane dane pozostają dostępne bez internetu.</span>
        </div>

        <div>
          <strong>Bezpieczne konto</strong>
          <span>Logowanie i autoryzacja za pomocą tokenu JWT.</span>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={getToken() ? "/pets" : "/login"}
              replace
            />
          }
        />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/pets"
          element={
            <ProtectedRoute>
              <PetsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pet-form"
          element={
            <ProtectedRoute>
              <PetFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;