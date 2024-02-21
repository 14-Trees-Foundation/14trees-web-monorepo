import ContributeForm from "components/ContributeForm";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import ProjectSelector from "components/ProjectSelector";
import { Project } from "schema";
// import notion from "lib/notion";
// import tree_graphic from "~/assets/images/tree_graphic.jpg";

const getFirst = (obj: string | string[]) => {
  if (!obj) return null;
  return Array.isArray(obj) ? obj[0] : obj;
};

const getProjects = async () => {
  const projects: Project[] = [
    {
      // mock project
      id: "mock",
      title: "Mockkk Project",
      description: "wow This is a mock project",
      image: "",
      price: 3500,
    },
  ];

  return {
    props: {
      projects,
    },
  };
};

const Contribute = () => {
  const projects = [];
  console.log(projects);
  // get the order id from the url params (nextjs router)

  return (
    <>
      <div className="min-h-screen py-32 lg:mx-4">
        <div className="relative mx-auto mb-10 max-w-screen-xl px-4 lg:mt-40 lg:flex 2xl:max-w-screen-2xl">
          <div className="my-12 w-full font-serif text-gray-700 lg:my-32 lg:mr-8 lg:w-3/5">
            <h1 className="text-3xl">Contribute to 14 Trees</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              euismod, nisl sit amet aliquam lacinia, nunc nisl aliquam tortor,
              eget aliquam nunc nisl sit amet lorem. Sed euismod, nisl sit amet
              aliquam lacinia, nunc nisl aliquam tortor, eget
            </p>
            {/* <ProjectSelector
              projects={projects}
              selectedProjectId={projectId}
              setProject={setProjectId}
            /> */}
          </div>
          <div className="container w-full max-w-xl bg-white bg-opacity-80 py-10 shadow-2xl lg:w-2/5">
            <ContributeForm
            // orderId={orderId}
            // project={
            // projects.find((p: Project) => p.id === projectId) || null
            // }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Contribute;
