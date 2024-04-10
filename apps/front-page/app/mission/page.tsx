import vision from "~/assets/images/vision.png";
import mission from "~/assets/images/mission.png";
import ImageFrame from "components/animation/ImageFrame";

const MissionPage = () => {
  return (
    <div className="min-h-screen bg-white p-32">
      <h1 className="title-text mb-24 text-center">Vision</h1>
      <ImageFrame src={vision} alt="vision" width={800} height={400} />
      <h1 className="title-text mb-24 mt-40 text-center">Mission</h1>
      <ImageFrame src={mission} alt="mission" width={800} height={400} />
    </div>
  );
};

export default MissionPage;
