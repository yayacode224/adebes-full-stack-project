"use client";

/**
 * Filet de sécurité de dernier recours : il ne se déclenche que si le layout
 * racine lui-même échoue. Ni police, ni thème, ni composant partagé ne sont
 * disponibles à ce stade — d'où le style en ligne et les balises `html` /
 * `body` obligatoires.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1b2b",
          color: "#e8eef4",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 12px" }}>
            Le site est momentanément indisponible
          </h1>
          <p
            style={{
              margin: "0 0 24px",
              color: "#9fb3c6",
              lineHeight: 1.6,
              fontSize: "0.95rem",
            }}
          >
            Nous vous invitons à réessayer dans un instant. Vous pouvez aussi
            nous joindre au +237 680 67 89 39.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "0 0 24px",
                color: "#63809b",
                fontSize: "0.75rem",
              }}
            >
              Référence : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4caf50",
              color: "#06121e",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
