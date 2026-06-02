export interface SurveyResponseDto {
  id: string;
  date: string;
  sex: string;
  diet: string;
  attrs: {
    color: number;
    aroma: number;
    firmeza: number;
    untuosidad: number;
    sabor_tostado: number;
    persistencia: number;
  };
  descriptiveComments: string;
  acceptance: number;
  liked: string;
  consumeAgain: string;
  recommend: number;
  affectiveComments: string;
}
