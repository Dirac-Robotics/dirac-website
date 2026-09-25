export class SampleError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
