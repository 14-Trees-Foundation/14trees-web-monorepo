// import Layout from '../components/Layout';
// import SEO from '../components/SEO';
import ContentHeader from "components/ContentHeading";
import Layout from "app/layout";
import Image from "next/image";
import TeamContent from "../../../content/Team.json";
import { TeamRow } from "../../../content/Team";

function getStaticProps() {
  return {
    props: {
      team: TeamContent,
    },
  };
}

const Team = ({ team }: { team: TeamRow[] }) => {
  const team_members = team.map((v) => ({
    name: v.name,
    bio: v.aboutMe,

    picture: v.picture[0]?.file?.url || "",
  }));

  return (
    <Layout>
      <div className="min-h-screen bg-white p-8">
        <h1 className="mb-8 text-3xl font-bold">Our Team</h1>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {team_members.map((member, i) => (
            <div key={i} className="flex flex-col items-center">
              <Image
                src={member.picture}
                alt={member.name}
                width={160}
                height={160}
                className="mb-4 h-40 w-40 rounded-full border-2 border-green-500 object-cover"
              />
              <h2 className="text-xl font-semibold text-gray-800">
                {member.name}
              </h2>
              <p className="mt-2 text-gray-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Team;
