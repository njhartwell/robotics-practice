export function validateOutput(actual: string, expected: string): boolean {
  const normalize = (s: string) => s.replace(/\r\n/g, "\n").trim();
  return normalize(actual) === normalize(expected);
}

export function validateMultipleChoice(
  selected: string,
  correctId: string
): boolean {
  return selected === correctId;
}

export function validateFillInTheBlank(
  answer: string,
  acceptedAnswers: string[]
): boolean {
  const normalized = answer.trim().toLowerCase();
  return acceptedAnswers.some((a) => a.toLowerCase() === normalized);
}
