
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("github-search-history")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!username) return;

    const controller = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setError("");
      setUser(null);
      setRepos([]);

      try {
        const response = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}`,
          { signal: controller.signal }
        );

        if (response.status === 404) {
          throw new Error("GitHub username not found. Please try again.");
        }

        if (response.status === 403 || response.status === 429) {
          throw new Error("GitHub API rate limit reached. Please try again later.");
        }

        if (!response.ok) {
          throw new Error("Unable to fetch the profile. Please try again.");
        }

        const profile = await response.json();

        const repoResponse = await fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`,
          { signal: controller.signal }
        );

        if (!repoResponse.ok) {
          throw new Error("Profile found, but repositories could not be loaded.");
        }

        const repositories = await repoResponse.json();

        setUser(profile);
        setRepos(repositories);

        setHistory((previous) => {
          const updated = [
            profile.login,
            ...previous.filter(
              (name) => name.toLowerCase() !== profile.login.toLowerCase()
            ),
          ].slice(0, 5);

          localStorage.setItem(
            "github-search-history",
            JSON.stringify(updated)
          );

          return updated;
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => controller.abort();
  }, [username]);

  function handleSearch(event) {
    event.preventDefault();

    const trimmed = input.trim().replace(/^@/, "");

    if (!trimmed) {
      setError("Please enter a GitHub username.");
      setUser(null);
      setRepos([]);
      setUsername("");
      return;
    }

    setError("");
    setUsername(trimmed);
  }

  function searchHistory(name) {
    setInput(name);
    setUsername(name);
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("github-search-history");
  }

  const totalStars = repos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  return (
    <main className={darkMode ? "app dark" : "app light"}>
      <nav className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">GH</span>
          <span>GitHub Finder</span>
        </a>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode((previous) => !previous)}
          aria-label="Toggle dark and light mode"
        >
          {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </nav>

      <section className="hero" id="home">
        <div className="eyebrow">
          <span className="live-dot"></span>
          POWERED BY GITHUB API
        </div>

        <h1>
          Discover developers.
          <br />
          <span>Explore their work.</span>
        </h1>

        <p className="hero-description">
          Find any GitHub developer and explore their profile,
          repositories, and open-source contributions.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a GitHub username..."
            aria-label="GitHub username"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search →"}
          </button>
        </form>

        <p className="search-hint">
          Try <button onClick={() => searchHistory("octocat")}>octocat</button>,
          <button onClick={() => searchHistory("torvalds")}> torvalds</button>,
          or your own username.
        </p>
      </section>

      {history.length > 0 && (
        <section className="history-section">
          <div className="section-heading">
            <h3>Recent searches</h3>
            <button className="text-button" onClick={clearHistory}>
              Clear history
            </button>
          </div>

          <div className="history-list">
            {history.map((name) => (
              <button
                key={name}
                className="history-chip"
                onClick={() => searchHistory(name)}
              >
                ↗ {name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="results-section">
        {loading && (
          <div className="status-card">
            <div className="spinner"></div>
            <h3>Finding developer...</h3>
            <p>Fetching profile and public repositories.</p>
          </div>
        )}

        {!loading && error && (
          <div className="status-card error-card" role="alert">
            <div className="status-icon">!</div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && !user && (
          <div className="welcome-card">
            <div className="welcome-icon">⌘</div>
            <h2>Your next discovery starts here.</h2>
            <p>
              Search for a username above to see a developer's GitHub profile
              and public projects.
            </p>
            <div className="feature-row">
              <span>◉ Profile details</span>
              <span>⑂ Repositories</span>
              <span>☆ Stars</span>
            </div>
          </div>
        )}

        {!loading && user && (
          <>
            <div className="profile-card">
              <div className="profile-top">
                <img
                  className="avatar"
                  src={user.avatar_url}
                  alt={`${user.login}'s GitHub avatar`}
                />

                <div className="profile-identity">
                  <span className="profile-label">GITHUB DEVELOPER</span>
                  <h2>{user.name || user.login}</h2>
                  <a
                    className="username"
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{user.login}
                  </a>
                  <span className="account-badge">
                    ✓ Public profile
                  </span>
                </div>

                <a
                  className="github-button"
                  href={user.html_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View GitHub ↗
                </a>
              </div>

              <p className="bio">
                {user.bio || "This developer hasn't added a bio yet."}
              </p>

              <div className="profile-details">
                {user.location && (
                  <span>⌖ {user.location}</span>
                )}
                {user.company && (
                  <span>▦ {user.company}</span>
                )}
                {user.blog && (
                  <a
                    href={
                      user.blog.startsWith("http")
                        ? user.blog
                        : `https://${user.blog}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗ {user.blog}
                  </a>
                )}
                <span>
                  Joined{" "}
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">⑂</span>
                  <span className="stat-label">Repositories</span>
                  <strong>{user.public_repos.toLocaleString()}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">♙</span>
                  <span className="stat-label">Followers</span>
                  <strong>{user.followers.toLocaleString()}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">♧</span>
                  <span className="stat-label">Following</span>
                  <strong>{user.following.toLocaleString()}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">☆</span>
                  <span className="stat-label">Stars found</span>
                  <strong>{totalStars.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="repo-heading">
              <div>
                <span className="profile-label">OPEN SOURCE</span>
                <h2>Public repositories</h2>
              </div>
              <span className="repo-count">{repos.length} loaded</span>
            </div>

            {repos.length === 0 ? (
              <div className="empty-repos">
                No public repositories found for this developer.
              </div>
            ) : (
              <div className="repo-grid">
                {repos.map((repo) => (
                  <article className="repo-card" key={repo.id}>
                    <div className="repo-title-row">
                      <span className="repo-symbol">⑂</span>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="repo-name"
                      >
                        {repo.name}
                      </a>
                    </div>

                    <p className="repo-description">
                      {repo.description || "No description provided."}
                    </p>

                    <div className="repo-meta">
                      {repo.language && (
                        <span className="language">
                          <span className="language-dot"></span>
                          {repo.language}
                        </span>
                      )}
                      <span>☆ {repo.stargazers_count}</span>
                      <span>⑂ {repo.forks_count}</span>
                    </div>

                    {repo.topics?.length > 0 && (
                      <div className="topics">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span key={topic}>{topic}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            <p className="repo-note">
              Showing up to 100 public repositories, sorted by recently updated.
            </p>
          </>
        )}
      </section>

      <footer className="footer">
        <p>
          Built with <span>♥</span> using React & GitHub API
        </p>
        <a
          href="https://docs.github.com/en/rest/users/users"
          target="_blank"
          rel="noreferrer"
        >
          API Documentation ↗
        </a>
      </footer>
    </main>
  );
}

export default App;
