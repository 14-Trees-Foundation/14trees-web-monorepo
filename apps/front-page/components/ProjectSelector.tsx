"use client"

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
  const [selectedProject, setSelectedProject] = useState<Project>(projects.find((project) => project.id === selectedProjectId));

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
          <div className="">
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
      className="w-full cursor-pointer rounded-md bg-white p-4 "
      onClick={onClick}
    >
      <div className="items-center">
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

const ExpandedProjectPage: React.FC<Project> = ({
  title,
  description,
  image,
  price,
}) => {
  return (
    <div className="font-serif mt-12">
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        <p>{description}</p>
        <p>{price}</p>
        <Image src={image} alt={title} />
    </div>
  );
};

export default ProjectSelector;
