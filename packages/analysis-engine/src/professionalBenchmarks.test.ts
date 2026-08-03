import {
  X_FACTOR_DEGREES,
  compareToProfessionalBenchmark,
} from "./professionalBenchmarks";

describe("compareToProfessionalBenchmark", () => {
  it("reports a value below the benchmark range as below", () => {
    expect(compareToProfessionalBenchmark(30, X_FACTOR_DEGREES)).toBe(
      "below",
    );
  });

  it("reports a value within the benchmark range as within", () => {
    expect(compareToProfessionalBenchmark(45, X_FACTOR_DEGREES)).toBe(
      "within",
    );
  });

  it("reports a value above the benchmark range as above", () => {
    expect(compareToProfessionalBenchmark(60, X_FACTOR_DEGREES)).toBe(
      "above",
    );
  });

  it("treats the exact low and high bounds as within range", () => {
    expect(
      compareToProfessionalBenchmark(X_FACTOR_DEGREES.low, X_FACTOR_DEGREES),
    ).toBe("within");
    expect(
      compareToProfessionalBenchmark(X_FACTOR_DEGREES.high, X_FACTOR_DEGREES),
    ).toBe("within");
  });
});
