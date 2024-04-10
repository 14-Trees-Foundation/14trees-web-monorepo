import { HomePage } from "components/Partials/HomePage";
import { Metadata } from "next";
import labels from "~/assets/labels.json";

export const metadata: Metadata = {
  title: labels.site.title,
  description: labels.site.description,
};

const Home = () => {
  return (
    <HomePage />
  );
}

export default Home;
