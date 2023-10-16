// import Layout from '../components/Layout';
// import SEO from '../components/SEO';
import ContentHeader from 'components/ContentHeading';
import Layout from 'components/Layout';
import Image from 'next/image';
import TeamContent  from '../../../content/Team.json'

const Team = ({team}) => {
  const team_members = team.map(v => ({
    name: v.name.title[0].plain_text,
    bio: v.content,
    picture: v.picture,
  }))

  return (
    <Layout>
      <div className="bg-white min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Our Team</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {team_members.map((member, i) => (
            <div key={i} className="flex flex-col items-center">
              <Image
                src={member.picture}
                alt={member.name}
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover mb-4 border-2 border-green-500"
              />
              <h2 className="text-xl font-semibold text-gray-800">{member.name}</h2>
              <p className="text-gray-600 mt-2">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Team;