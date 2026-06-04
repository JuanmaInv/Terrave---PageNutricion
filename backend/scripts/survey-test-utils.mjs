export const backendBase = (process.env.BACKEND_URL ?? "http://127.0.0.1:3000/api/v1").replace(/\/+$/, "");

export function buildSurvey(index, sessionId, prefix = "test") {
  return {
    id: `${prefix}_${Date.now()}_${index}`,
    sessionId,
    date: new Date().toISOString(),
    sex: index % 2 === 0 ? "femenino" : "masculino",
    diet: ["omnivoro", "ovo_lacto", "vegano"][index % 3],
    attrs: {
      color: 4,
      aroma: 4,
      firmeza: 4,
      untuosidad: 4,
      sabor_tostado: 4,
      persistencia: 4,
    },
    descriptiveComments: `${prefix} survey ${index}`,
    acceptance: 4,
    liked: "si",
    consumeAgain: "si",
    recommend: 4,
    willingnessToPay: "4500",
    affectiveComments: `${prefix} survey ${index}`,
  };
}

export async function createSession(index, currentStep = 2) {
  const clientSessionKey = `test-client-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await fetch(`${backendBase}/encuestas/sesiones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientSessionKey,
      currentStep,
      sex: index % 2 === 0 ? "femenino" : "masculino",
      diet: ["omnivoro", "ovo_lacto", "vegano"][index % 3],
      willingnessToPay: "4500",
    }),
  });

  if (!response.ok) {
    throw new Error(`session failed for user ${index}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function submitSurvey(index, sessionId, prefix = "test") {
  const response = await fetch(`${backendBase}/encuestas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSurvey(index, sessionId, prefix)),
  });

  if (!response.ok) {
    throw new Error(`survey failed for user ${index}: ${response.status} ${await response.text()}`);
  }

  await response.text();
}

export function percentile(sortedValues, ratio) {
  return sortedValues[Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * ratio))];
}
