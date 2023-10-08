export type MyInterestshobbiesType = "Sports" | "Travelling" | "Motorcycles" | "Outdoor Adventuring" | "Gardening" | "Bharatnatyam" | "Western Ghats Flora" | "Restoration/Reforestation" | "Wild Gardening" | "Organic farming" | "Travelling in nature" | "Wood carving" | "Music" | "Kathak" | "Problem Solving";

export type EngagedInType = "Site Guide" | "CSR" | "NGO partnership" | "Google earth" | "Back office" | "Govt. partnership" | "Data management" | "Content writing" | "Software and Apps" | "Fundraising" | "Outreach" | "SOPs/ templates" | "Accounting" | "Academic partnership" | "Guided tours" | "Creative designs" | "Video creation" | "Biodiversity survey" | "Photography" | "Nursery";

export type VolunteeringForType = "Eco-awarenesss" | "Bio-div log" | "Birdwatching" | "Natural food" | "Community engagement" | "Landscape design" | "Rural economics" | "Grassland management" | "Outbound marketing" | "Creative artwork" | "Nursery" | "New site" | "EV/ battery tech" | "Solar tech" | "Calligraphy" | "Graphic Design" | "yet to fill form" | "Photography" | "IT/Eng" | "Creative writing" | "Biofuels";

export type LanguagesType = "English" | "Marathi" | "Hindi" | "Bengali";

export interface team {
    howDidYouGetEngagedWith14trees: string;
    phone: string;
    linkedin: string;
    myInterestshobbies: MyInterestshobbiesType[];
    engagedIn: EngagedInType[];
    startDate: string;
    volunteeringFor: VolunteeringForType[];
    favouriteFruit: string;
    aboutMe: string;
    tshirtSize: string;
    email: string;
    status: string;
    languages: LanguagesType[];
    dashboard: string;
    name: string;
}