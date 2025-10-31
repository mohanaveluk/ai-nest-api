// Retry mechanism utility
export class RetryHandler {
  static async retry<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw new Error(`Operation failed after ${maxAttempts} attempts: ${error.message}`);
        }
      }
    }
    throw new Error('Retry logic failed unexpectedly');
  }
}
``