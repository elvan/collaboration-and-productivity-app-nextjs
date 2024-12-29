/**
 * Calculate the dot product of two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

/**
 * Calculate the magnitude (length) of a vector
 */
export function magnitude(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
}

/**
 * Calculate the cosine distance between two vectors
 * Returns a value between 0 (identical) and 1 (completely different)
 */
export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length")
  }

  const dot = dotProduct(a, b)
  const magA = magnitude(a)
  const magB = magnitude(b)

  if (magA === 0 || magB === 0) {
    return 1
  }

  const similarity = dot / (magA * magB)
  return 1 - Math.max(-1, Math.min(1, similarity))
}

/**
 * Calculate the Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length")
  }

  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  )
}

/**
 * Normalize a vector to have unit length (magnitude of 1)
 */
export function normalizeVector(vector: number[]): number[] {
  const mag = magnitude(vector)
  if (mag === 0) {
    return vector
  }
  return vector.map((val) => val / mag)
}

/**
 * Calculate the average of multiple vectors
 */
export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return []
  }

  const length = vectors[0].length
  if (!vectors.every((v) => v.length === length)) {
    throw new Error("All vectors must have the same length")
  }

  const sum = vectors.reduce(
    (acc, vector) => acc.map((val, i) => val + vector[i]),
    new Array(length).fill(0)
  )

  return sum.map((val) => val / vectors.length)
}

/**
 * Calculate the weighted average of multiple vectors
 */
export function weightedAverageVectors(
  vectors: number[][],
  weights: number[]
): number[] {
  if (vectors.length === 0 || vectors.length !== weights.length) {
    throw new Error("Must have same number of vectors and weights")
  }

  const length = vectors[0].length
  if (!vectors.every((v) => v.length === length)) {
    throw new Error("All vectors must have the same length")
  }

  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  if (weightSum === 0) {
    throw new Error("Weights sum must be greater than 0")
  }

  const sum = vectors.reduce(
    (acc, vector, i) =>
      acc.map((val, j) => val + vector[j] * weights[i]),
    new Array(length).fill(0)
  )

  return sum.map((val) => val / weightSum)
}
