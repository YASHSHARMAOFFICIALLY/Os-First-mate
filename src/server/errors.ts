export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function processErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const maybeProcessError = error as {
      stderr?: string;
      stdout?: string;
      message?: string;
    };

    return (
      maybeProcessError.stderr?.trim() ||
      maybeProcessError.stdout?.trim() ||
      maybeProcessError.message ||
      fallback
    );
  }

  return errorMessage(error, fallback);
}
