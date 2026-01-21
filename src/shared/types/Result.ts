/**
 * Result Type - Pattern pour gérer les erreurs sans exceptions
 * 
 * Usage:
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return failure('Division by zero');
 *   return success(a / b);
 * }
 * 
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.data); // 5
 * } else {
 *   console.log(result.error); // never reached
 * }
 * ```
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Crée un résultat de succès
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Crée un résultat d'échec
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Vérifie si un résultat est un succès
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Vérifie si un résultat est un échec
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Extrait la donnée ou throw l'erreur
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Extrait la donnée ou retourne une valeur par défaut
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Map sur un Result (transforme la donnée si succès)
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * FlatMap sur un Result (chaîne les opérations)
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}
