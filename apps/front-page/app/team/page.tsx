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

  return (
    <div className="min-h-screen bg-white p-32">
      <h1 className="title-text mb-24 text-center">Our Team</h1>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
        {team_members.map((member, i) => (
          // <div key={i} className="flex flex-col items-center">
          //   <Image
          //     src={member.picture}
          //     alt={member.name}
          //     width={160}
          //     height={160}
          //     className="mb-4 h-40 w-40 rounded-full border-2 border-green-500 object-cover"
          //   />
          //   <h2 className="text-xl font-semibold text-gray-800">
          //     {member.name}
          //   </h2>
          //   <p className="mt-2 text-gray-600">{member.bio}</p>
          // </div>
          <Person
            key={member.name}
            image={member.picture}
            name={member.name}
            bio={member.bio}
          />
        ))}
      </div>
    </div>
  );
};

export default Team;
