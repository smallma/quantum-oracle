declare module "lunar-javascript" {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getMonthZhiExact(): string;
    getDayInGanZhiExact(): string;
    getDayZhiExact(): string;
  }
}
