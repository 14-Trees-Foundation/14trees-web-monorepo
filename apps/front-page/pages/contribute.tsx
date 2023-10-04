import ContributeForm from "components/ContributeForm";
import Layout from "components/Layout";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import ProjectSelector from "components/ProjectSelector";
import { Project } from "schema";
import notion from "lib/notion";
import tree_graphic from "../src/assets/images/tree_graphic.jpg"

const getFirst = (obj: string | string[]) => {
  if (!obj) return null;
  return Array.isArray(obj) ? obj[0] : obj;
};

export const getStaticProps = async () => {

  const projectsDB = await notion.databases.query({
    database_id: "dfbdb25925cc45dba7eda2a1fc635824",
  });

  // const projects = [];
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

  const projects: Project[] = [{
    // mock project
    id: "mock",
    title: "Mockkk Project",
    description: "wow This is a mock project",
    image: "",
    price: 3500,
  }]

  return {
    props: {
      projects,
    },
  };
};

const Contribute = ({ projects }: { projects: Project[] }) => {
  const router = useRouter();
  const [projectId, setProjectId] = useState<Project["id"]>(projects[0].id);
  const [orderId, setOrderId] = useState<string>(null);
  console.log(projects);
  // get the order id from the url params (nextjs router)
  useEffect(() => {
    if (router.isReady) {
      if (router.query.orderId)
        setOrderId(getFirst(router.query.orderId));
      if (router.query.project)
        setProjectId(getFirst(router.query.project));
    }
  }, [router.isReady, router.query.orderId, router.query.project]);

  return (
    <Layout>
      <div className="lg:mx-4">
        <div className="fixed bottom-0 lg:right-1/4 w-full">
          <div className="ml-auto lg:w-1/2">
            <Image src={tree_graphic} alt="Tree Graphic" className="w-full opacity-10 -rotate-45"/>
          </div>
        </div>
        <div className="mx-auto lg:mt-10 lg:flex max-w-screen-xl relative">
          <div className="w-full lg:w-3/5 px-12 my-12 lg:my-32 font-serif text-gray-700">
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
          <div className="w-full lg:w-2/5 max-w-xl container shadow-2xl bg-white py-10 bg-opacity-80">
                <ContributeForm
                  orderId={orderId}
                  project={
                    projects.find((p: Project) => p.id === projectId) || null
                  }
                />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contribute;