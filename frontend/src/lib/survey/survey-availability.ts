export type SurveyPublicationStatus = "activa" | "cerrada" | "inactiva" | "borrador";

export function canRespondToSurvey(status: SurveyPublicationStatus): boolean {
  return status === "activa";
}

export function canDisplaySurveyToRespondent(status: SurveyPublicationStatus): boolean {
  return status === "activa";
}
