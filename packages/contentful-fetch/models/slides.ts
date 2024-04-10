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

export const vetaleSlidesQuery = `
    query {
    campaign(id:"4NDynLkwYxmlk6Lsfy7Iag") {
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

export type CampaignSlide = {
  url: string;
};
