import { TeamRow } from "~/data/content/Team";
import TeamContent from "~/data/content/Team/Team.json";
import Person from "components/Person";

const TeamList = TeamContent as TeamRow[];

const Team = () => {
  const team_members = TeamList.map((v) => ({
    name: v.name,
    bio: v.aboutMe,
    picture: v.picture[0]?.id ? `/content/${v.picture[0]?.id}` : null,
  }));

  function SectionComponent({title, names}) {
    const members = team_members.filter((v) => names.includes(v.name));
    return (<div className="w-full mt-12">
          <div className="text-center text-4xl">{title}</div>
          <div className="flex justify-center w-full flex-wrap">
            {members.length > 0 && members.map((member, i) => (
              <div className="my-4 p-4 w-1/3" key={member.name}>
                  <Person
                    image={member.picture}
                    name={member.name}
                    bio={member.bio}
                  />
              </div>
            )) }
          </div>
        </div>)
  }

  const FounderSection = () => {
    return (
      <SectionComponent title="Founder" names={["Pravin Bhagwat"]} />
    );
  }

  const BoardSection = () => {
    const board_members = ["Pravin Bhagwat", "Kiran Deshpande"];
    return (
      <SectionComponent title="Board" names={board_members}/>
    );
  }

  const AdvisorySection = () => {
    const advisory_members = ["C.K.Pradeep"];
    return (
      <SectionComponent title="Advisory" names={advisory_members} />
    );
  }

  const BackofficeSection = () => {
    const backoffice_members = [
      "Sanjeev Jagtap",
      "Shivangi Datar",
      "Sanjeev Naik",
      "Medha Bhagwat",
      "Anita Marathe",
      "Chaitanya Bhagwat",
      "Chetan Agrawal",
      "Sagar Ganoo",
      "Nirmala Samant",
      "Akash Keshav"
    ];
    return (
      <SectionComponent title="Backoffice Volunteers" names={backoffice_members}/>
    );
  }

  return (
    <div className="min-h-screen bg-white p-32">
      <h1 className="title-text mb-24 text-center">Our Team</h1>
      <div className="my-12">
        <FounderSection />
        <BoardSection />
        <AdvisorySection />
        <BackofficeSection />
      </div>
    </div>
  );
};

export default Team;
