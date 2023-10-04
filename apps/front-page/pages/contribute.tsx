import ContributeForm from "components/ContributeForm";
import Layout from "components/Layout";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import ProjectSelector from "components/ProjectSelector";
import { Project } from "schema";
import notion from "lib/notion";

const getFirst = (obj: string | string[]) => {
  if (!obj) return null;
  return Array.isArray(obj) ? obj[0] : obj;
};

export const getStaticProps = async () => {

  const projectsDB = await notion.databases.query({
    database_id: "dfbdb25925cc45dba7eda2a1fc635824",
  });

  const projects = [];
  // for (const project of projectsDB.results) {
  //   const page = await notion.pages.retrieve({ page_id: project.id });
  //   console.log(page);
  //   projects.push({
  //       id: page.id,
  //       // @ts-ignore
  //       name: page.properties.Name.title[0].plain_text,
  //       // @ts-ignore
  //       description: page.properties.Description.rich_text[0].plain_text,
  //       // @ts-ignore
  //       image: page.properties.Image.files[0].file.url,
  //       // @ts-ignore
  //       goal: page.properties.Goal.number,
  //       // @ts-ignore
  //       raised: page.properties.Raised.number,
  //   })
  // }

  return {
    props: {
      projects,
    },
  };
};

const Contribute = ({ projects }: { projects: Project[] }) => {
  const router = useRouter();
  const [projectId, setProjectId] = useState<Project["id"]>(null);
  const [orderId, setOrderId] = useState<string>(null);
  console.log(projects);
  // get the order id from the url params (nextjs router)
  useEffect(() => {
    if (router.isReady) {
      setOrderId(getFirst(router.query.orderId));
      setProjectId(getFirst(router.query.project));
    }
  }, [router.isReady, router.query.orderId, router.query.project]);

  return (
    <Layout>
      <div className="mx-auto flex max-w-screen-2xl">
        <div className="mt-10 w-2/5 bg-gray-200 px-12 py-32  font-serif text-gray-700 shadow-xl">
          <h1 className="text-3xl">Contribute to 14 Trees</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            euismod, nisl sit amet aliquam lacinia, nunc nisl aliquam tortor,
            eget aliquam nunc nisl sit amet lorem. Sed euismod, nisl sit amet
            aliquam lacinia, nunc nisl aliquam tortor, eget
          </p>
          <ProjectSelector
            projects={projects}
            selectedProjectId={projectId}
            setProject={setProjectId}
          />
        </div>
        <div className="mt-10 sm:mt-20 container">
          <div className="lg:(py-32 rounded-md) mb-12 px-2">
            {/* <h1 className="title-text">Contribute Now</h1> */}
            <div className="mr-auto mt-8 max-w-screen-md md:mt-20">
              {/* <div className="w-2/3"> */}
              <ContributeForm
                orderId={orderId}
                project={
                  projects.find((p: Project) => p.id === projectId) || null
                }
              />
              {/* </div> */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contribute;