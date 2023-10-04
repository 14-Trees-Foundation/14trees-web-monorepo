import { useState } from "react";
import Image from "next/image";
import { Project } from "schema";

type ProjectSelectorProps = {
  selectedProjectId: string | null;
  projects: Project[];
  setProject: React.Dispatch<React.SetStateAction<string | null>>;
};

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  setProject,
}) => {
  const [selectedProject, setSelectedProject] = useState<Project>(null);

  // Function to handle project selection
  const handleProjectSelection = (selectedProject: Project) => {
    setSelectedProject(selectedProject); // Set the selected project in the component
    setProject(selectedProject.id); // Set the selected project in the parent component
  };

  // Function to handle going back to the project selector
  const handleGoBack = () => {
    setProject(null); // Reset the selected project in the parent component
  };

  return (
    <>
      {selectedProjectId ? (
        <>
          <button
            className="fixed bottom-4 right-4 rounded-md bg-blue-500 px-4 py-2 text-white"
            onClick={handleGoBack}
          >
            Go Back
          </button>
          <div className="flex h-screen items-center justify-center">
            <ExpandedProjectPage {...selectedProject} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects?.map((project) => (
            <ProjectCard {...project} key={project.id} onClick={handleGoBack} />
          ))}
        </div>
      )}
    </>
  );
};

type ProjectCardProps = Project & {
  onClick: () => void;
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  onClick,
  image,
  price,
}) => {
  return (
    <div
      className="cursor-pointer rounded-md bg-white p-4 shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center">
        <Image
          height={64}
          width={64}
          className="mr-4 h-16 w-16 rounded-full"
          src={image}
          alt="Project"
        />
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-gray-500">{description}</p>
        </div>
        <div className="flex-grow"></div>
        <div className="text-right">
          <p className="text-xl font-bold">${price}</p>
        </div>
      </div>
    </div>
  );
};

type ExpandedProjectPageProps = {
  title: string;
  description: string;
  // Add additional properties for the expanded project
};

const ExpandedProjectPage: React.FC<ExpandedProjectPageProps> = ({
  title,
  description,
}) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-md bg-white p-4 shadow-md">
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default ProjectSelector;
