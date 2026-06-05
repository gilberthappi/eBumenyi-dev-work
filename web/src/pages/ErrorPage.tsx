/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Oops!</h1>
        <p>Status: {error.status}</p>
        <p>{error.statusText}</p>
        {error.data && <pre>{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  }

  // For unexpected errors
  return (
    <div>
      <h1>Oops!</h1>
      <p>{(error as any)?.message || "Something went wrong"}</p>
      {error && (
        <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
          {(error as any).stack || JSON.stringify(error, null, 2)}
        </pre>
      )}
    </div>
  );
}
