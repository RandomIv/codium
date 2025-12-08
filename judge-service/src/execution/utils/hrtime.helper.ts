export class HrtimeHelper {
  static start(): [number, number] {
    return process.hrtime();
  }
  static elapsedMs(startTime: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return seconds * 1000 + nanoseconds / 1e6;
  }
}
