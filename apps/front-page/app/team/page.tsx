import { TeamRow } from "~/data/content/Team";
import TeamContent from "~/data/content/Team/Team.json";
import Person from "components/Person";

// @ts-ignore
const TeamList = TeamContent as TeamRow[];

const Team = () => {
  const team_members = TeamList.map((v) => ({
    name: v.name,
    bio: v.publicBio,
    title: v.publicTitle,
    link: v.publicUrlLinkedinEtc,
    picture: v.picture[0]?.id ? `/content/${v.picture[0]?.id}` : null,
  }));

  function SectionComponent({ title, names }) {
    const members = team_members.filter((v) => names.includes(v.name));
    return (
      <div className="container mt-12 w-full">
        <div className="text-center text-4xl">{title}</div>
        <div className="flex w-full flex-wrap justify-center">
          {members.length > 0 &&
            members.map((member, i) => (
              <div
                className="my-4 mt-20 min-h-[30vh] w-full py-4 md:w-1/3"
                key={member.name}
              >
                <Person
                  image={member.picture || undefined}
                  title={member.title}
                  link={member.link || undefined}
                  name={member.name}
                  bio={member.bio}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  const founders = ["Pravin Bhagwat"];
  const board_members = ["Pravin Bhagwat", "Kiran Deshpande"];
  const advisory_members = [
    "Girish Sohani",
    "Shirish Deodhar",
    "Ajay Phatak",
  ];
  const backoffice_members = [
    "Sanjeev Jagtap",
    "Shivangi Datar",
    "Sanjeev Naik",
    "C.K.Pradeep",
    "Medha Bhagwat",
    "Anita Marathe",
    "Chaitanya Bhagwat",
    "Chetan Agrawal",
    "Sagar Ganoo",
    "Nirmala Samant",
    "Akash Keshav",
  ];
  // add everyone else to backoffice
  const other_members = team_members.filter(
    (v) =>
      Boolean(v.name) &&
      Boolean(v.title) &&
      !founders.includes(v.name) &&
      !board_members.includes(v.name) &&
      !advisory_members.includes(v.name) &&
      !backoffice_members.includes(v.name)
  );

  return (
    <div className="min-h-screen bg-white py-32">
      <h1 className="title-text mb-24 text-center">Our Team</h1>
      <div className="my-12">
        <SectionComponent title="Founder" names={founders} />
        <SectionComponent title="Board" names={board_members} />
        <SectionComponent title="Advisory" names={advisory_members} />
        <SectionComponent
          title="Backoffice Volunteers"
          names={[...backoffice_members, ...other_members.map((v) => v.name)]}
        />
      </div>
    </div>
  );
};

export default Team;
