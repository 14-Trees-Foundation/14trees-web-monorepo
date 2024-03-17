export const iitkSlidesQuery = `
    query {
    campaign(id:"6VbTG330H5sOtA38jyDRvG") {
        title
        presentations: presentationsCollection {
        items {
            slides: slidesCollection {
            items {
                url 
            }
            }
        }
        }
    }
    }
`;


/*
"presentation": {
"items": [
  {
    "slides": {
      "items": [
        {
          "url": 
*/
export type IitkSlide = {
  url: string;
};
