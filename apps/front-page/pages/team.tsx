// import Layout from '../components/Layout';
// import SEO from '../components/SEO';
import ContentHeader from 'components/ContentHeading';
import Layout from 'components/Layout';
import notion from 'lib/notion';
// import InfoSections from 'components/InfoSections';
import Image from 'next/image';

export const getStaticProps = async () => {
  const teamDB = await notion.databases.query({
    database_id: "b0961650e64842c7b9c72d88843d9554",
  });

  const team= [];
  for (const vol of teamDB.results) {
    const page = await notion.pages.retrieve({ page_id: vol.id });
    console.log(page);
    team.push({
      // @ts-ignore
      name: page.properties.Name
    })
  }

  return {
    props: {
      team
    },
  };
}

const Team = ({team}) => {
  return (
    <Layout>
      {team.map((volunteer, index) => (
        <div key={index} className="flex flex-col items-center justify-center">
          {volunteer.name.title[0].plain_text}
        </div>
      ))}
    </Layout>
  );
};

export default Team;